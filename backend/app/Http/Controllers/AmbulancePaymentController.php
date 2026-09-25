<?php

namespace App\Http\Controllers;

use App\Services\AmbulanceRecords;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AmbulancePaymentController extends Controller
{
    public function index()
    {
        return response()->json($this->payments());
    }

    public function show(int $id)
    {
        return response()->json(['payment' => $this->findPayment($id)]);
    }

    public function summary()
    {
        $summary = DB::selectOne(<<<'SQL'
            SELECT COUNT(*) AS total_payments,
                COALESCE(SUM(payment_status = 'pending'), 0) AS pending_count,
                COALESCE(SUM(payment_status = 'paid'), 0) AS paid_count,
                COALESCE(SUM(payment_status = 'refunded'), 0) AS refunded_count,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) AS total_collected,
                COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN amount ELSE 0 END), 0) AS total_refunded
            FROM ambulance_payments
        SQL);

        return response()->json(['summary' => $summary]);
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request, true);
        try {
            $payment = DB::transaction(function () use ($data) {
                $booking = (new AmbulanceRecords)->lockBooking((int) $data['ambulance_booking_id']);
                $this->checkBookingStatus($booking);
                if (DB::selectOne('SELECT id FROM ambulance_payments WHERE ambulance_booking_id = ?', [$booking->id])) {
                    throw ValidationException::withMessages(['ambulance_booking_id' => 'This booking already has a payment record.']);
                }
                $this->checkReference($data['transaction_reference']);
                $status = $data['payment_status'] ?? 'pending';
                DB::insert(<<<'SQL'
                    INSERT INTO ambulance_payments (
                        ambulance_booking_id, amount, payment_method, payment_status,
                        transaction_reference, paid_at, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                SQL, [$booking->id, $data['amount'], $data['payment_method'], $status,
                    $data['transaction_reference'], $status === 'paid' ? now() : null]);

                return $this->findPayment((int) DB::selectOne('SELECT LAST_INSERT_ID() AS id')->id);
            }, 3);
        } catch (QueryException $error) {
            $this->duplicateError($error);
        }

        return response()->json(['message' => 'Payment record created successfully.', 'payment' => $payment], 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $this->validatedData($request, false);
        try {
            $payment = DB::transaction(function () use ($id, $data) {
                $payment = $this->lockPayment($id);
                if ($payment->payment_status !== 'pending') {
                    throw ValidationException::withMessages(['payment' => 'Only pending payment records can be edited.']);
                }
                $this->checkReference($data['transaction_reference'], $id);
                DB::update(<<<'SQL'
                    UPDATE ambulance_payments SET amount = ?, payment_method = ?, transaction_reference = ?,
                        updated_at = CURRENT_TIMESTAMP WHERE id = ?
                SQL, [$data['amount'], $data['payment_method'], $data['transaction_reference'], $id]);

                return $this->findPayment($id);
            }, 3);
        } catch (QueryException $error) {
            $this->duplicateError($error);
        }

        return response()->json(['message' => 'Payment updated successfully.', 'payment' => $payment]);
    }

    public function updateStatus(Request $request, int $id)
    {
        $data = $request->validate(['payment_status' => ['required', 'in:paid,refunded']]);
        $payment = DB::transaction(function () use ($id, $data) {
            // Booking first: same lock order as booking cancellation and payment creation.
            $existing = $this->findPayment($id);
            $booking = (new AmbulanceRecords)->lockBooking((int) $existing->ambulance_booking_id);
            $payment = $this->lockPayment($id);
            $status = $data['payment_status'];
            if ($payment->payment_status === $status) {
                return $this->findPayment($id);
            }
            $transitions = ['pending' => ['paid'], 'paid' => ['refunded'], 'refunded' => []];
            if (! in_array($status, $transitions[$payment->payment_status], true)) {
                throw ValidationException::withMessages(['payment_status' => "A {$payment->payment_status} payment cannot be changed to {$status}."]);
            }
            if ($status === 'paid') {
                $this->checkBookingStatus($booking);
            }
            DB::update(<<<'SQL'
                UPDATE ambulance_payments SET payment_status = ?,
                    paid_at = CASE WHEN ? = 'paid' THEN CURRENT_TIMESTAMP ELSE paid_at END,
                    updated_at = CURRENT_TIMESTAMP WHERE id = ?
            SQL, [$status, $status, $id]);

            return $this->findPayment($id);
        }, 3);

        return response()->json(['message' => 'Payment status updated successfully.', 'payment' => $payment]);
    }

    public function destroy(int $id)
    {
        DB::transaction(function () use ($id) {
            $payment = $this->lockPayment($id);
            if ($payment->payment_status !== 'pending') {
                throw ValidationException::withMessages(['payment' => 'Paid and refunded payment records cannot be deleted because they are part of the financial history.']);
            }
            DB::delete('DELETE FROM ambulance_payments WHERE id = ?', [$id]);
        }, 3);

        return response()->json(['message' => 'Payment record deleted successfully.']);
    }

    private function validatedData(Request $request, bool $creating): array
    {
        $rules = [
            'amount' => ['required', 'numeric', 'gt:0', 'max:99999999.99', 'decimal:0,2'],
            'payment_method' => ['required', 'in:cash,card,mobile_banking'],
            'transaction_reference' => ['nullable', 'string', 'max:100'],
        ];
        if ($creating) {
            $rules['ambulance_booking_id'] = ['required', 'integer', 'min:1'];
            $rules['payment_status'] = ['sometimes', 'in:pending,paid'];
        }
        $data = $request->validate($rules);
        $reference = trim($data['transaction_reference'] ?? '');
        $data['transaction_reference'] = $reference === '' ? null : $reference;

        return $data;
    }

    private function checkBookingStatus(object $booking): void
    {
        if (! in_array($booking->status, ['confirmed', 'completed'], true)) {
            throw ValidationException::withMessages(['ambulance_booking_id' => 'A payment can only be created for a confirmed or completed booking.']);
        }
    }

    private function payments(?int $id = null): array
    {
        $sql = <<<'SQL'
            SELECT p.*, b.status AS booking_status, b.pickup_district, b.destination_district,
                u.name AS customer_name
            FROM ambulance_payments p
            JOIN ambulance_bookings b ON b.id = p.ambulance_booking_id
            LEFT JOIN users u ON u.id = b.user_id
        SQL;

        return DB::select($sql.($id === null ? ' ORDER BY p.id DESC' : ' WHERE p.id = ?'), $id === null ? [] : [$id]);
    }

    private function findPayment(int $id): object
    {
        return $this->payments($id)[0] ?? abort(404, 'Ambulance payment not found.');
    }

    private function lockPayment(int $id): object
    {
        return DB::selectOne('SELECT * FROM ambulance_payments WHERE id = ? FOR UPDATE', [$id])
            ?? abort(404, 'Ambulance payment not found.');
    }

    private function checkReference(?string $reference, int $id = 0): void
    {
        if ($reference !== null && DB::selectOne('SELECT id FROM ambulance_payments WHERE transaction_reference = ? AND id <> ?', [$reference, $id])) {
            throw ValidationException::withMessages(['transaction_reference' => 'The transaction reference has already been taken.']);
        }
    }

    private function duplicateError(QueryException $error): never
    {
        if ((int) ($error->errorInfo[1] ?? 0) === 1062) {
            throw ValidationException::withMessages(['payment' => 'This booking or transaction reference already has a payment record.']);
        }

        throw $error;
    }
}
