<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function index()
    {
        return Payment::with(['booking.car', 'booking.driver'])
            ->orderByDesc('id')
            ->get();
    }

    public function summary()
    {
        $summary = Payment::query()
            ->selectRaw('COUNT(*) AS total_payments')
            ->selectRaw("COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_count")
            ->selectRaw("COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_count")
            ->selectRaw("COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN 1 ELSE 0 END), 0) AS refunded_count")
            ->selectRaw("COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) AS total_collected")
            ->selectRaw("COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN amount ELSE 0 END), 0) AS total_refunded")
            ->selectRaw("COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN amount END), 0) AS average_paid_amount")
            ->selectRaw('COALESCE(MIN(amount), 0) AS minimum_amount')
            ->selectRaw('COALESCE(MAX(amount), 0) AS maximum_amount')
            ->first();

        return response()->json([
            'summary' => $summary,
        ]);
    }

    public function store(Request $request)
    {
        $this->normalizeReferenceInput($request);
        $validated = $request->validate($this->rules());

        $payment = DB::transaction(function () use ($validated) {
            $booking = Booking::whereKey($validated['booking_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if (!in_array($booking->booking_status, ['Confirmed', 'Completed'], true)) {
                throw ValidationException::withMessages([
                    'booking_id' => 'A payment can only be created for a confirmed or completed booking.',
                ]);
            }

            if (Payment::where('booking_id', $booking->b_id)->exists()) {
                throw ValidationException::withMessages([
                    'booking_id' => 'This booking already has a payment record.',
                ]);
            }

            $status = $validated['payment_status'] ?? 'pending';

            return Payment::create([
                'booking_id' => $booking->b_id,
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'payment_status' => $status,
                'transaction_reference' => $this->normalizeReference(
                    $validated['transaction_reference'] ?? null,
                ),
                'paid_at' => $status === 'paid' ? now() : null,
            ]);
        }, 3);

        return response()->json([
            'message' => 'Payment record created successfully.',
            'payment' => $payment->load(['booking.car', 'booking.driver']),
        ], 201);
    }

    public function show(Payment $payment)
    {
        return response()->json([
            'payment' => $payment->load(['booking.car', 'booking.driver']),
        ]);
    }

    public function update(Request $request, Payment $payment)
    {
        if ($payment->payment_status !== 'pending') {
            throw ValidationException::withMessages([
                'payment' => 'Only pending payment information can be edited.',
            ]);
        }

        $this->normalizeReferenceInput($request);
        $validated = $request->validate($this->rules($payment, false));

        $payment->update([
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'transaction_reference' => $this->normalizeReference(
                $validated['transaction_reference'] ?? null,
            ),
        ]);

        return response()->json([
            'message' => 'Payment information updated successfully.',
            'payment' => $payment->fresh()->load([
                'booking.car',
                'booking.driver',
            ]),
        ]);
    }

    public function updateStatus(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'payment_status' => ['required', 'in:paid,refunded'],
        ]);

        $payment = DB::transaction(function () use ($payment, $validated) {
            $lockedPayment = Payment::whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();
            $newStatus = $validated['payment_status'];

            if ($lockedPayment->payment_status === $newStatus) {
                return $lockedPayment;
            }

            $allowedTransitions = [
                'pending' => ['paid'],
                'paid' => ['refunded'],
                'refunded' => [],
            ];

            if (!in_array(
                $newStatus,
                $allowedTransitions[$lockedPayment->payment_status] ?? [],
                true,
            )) {
                throw ValidationException::withMessages([
                    'payment_status' => "A {$lockedPayment->payment_status} payment cannot be changed to {$newStatus}.",
                ]);
            }

            $lockedPayment->payment_status = $newStatus;

            if ($newStatus === 'paid' && !$lockedPayment->paid_at) {
                $lockedPayment->paid_at = now();
            }

            $lockedPayment->save();

            return $lockedPayment;
        }, 3);

        return response()->json([
            'message' => $payment->payment_status === 'paid'
                ? 'Payment marked as paid successfully.'
                : 'Payment refunded successfully.',
            'payment' => $payment->load([
                'booking.car',
                'booking.driver',
            ]),
        ]);
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();

        return response()->json([
            'message' => 'Payment record deleted successfully.',
        ]);
    }

    private function rules(?Payment $payment = null, bool $includeBooking = true): array
    {
        $referenceUniqueRule = Rule::unique(
            'payments',
            'transaction_reference',
        );

        if ($payment) {
            $referenceUniqueRule->ignore($payment->id);
        }

        $rules = [
            'amount' => ['required', 'numeric', 'gt:0', 'max:99999999.99'],
            'payment_method' => [
                'required',
                'in:cash,card,mobile_banking',
            ],
            'transaction_reference' => [
                'nullable',
                'string',
                'max:100',
                $referenceUniqueRule,
            ],
        ];

        if ($includeBooking) {
            $rules['booking_id'] = [
                'required',
                'integer',
                'exists:bookings,b_id',
                'unique:payments,booking_id',
            ];
            $rules['payment_status'] = [
                'sometimes',
                'in:pending,paid',
            ];
        }

        return $rules;
    }

    private function normalizeReference(?string $reference): ?string
    {
        $trimmedReference = trim((string) $reference);

        return $trimmedReference === '' ? null : $trimmedReference;
    }

    private function normalizeReferenceInput(Request $request): void
    {
        $reference = $request->input('transaction_reference');

        if (is_string($reference)) {
            $request->merge([
                'transaction_reference' => $this->normalizeReference($reference),
            ]);
        }
    }
}
