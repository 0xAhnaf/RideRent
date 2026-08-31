<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function index()
    {
        $rows = DB::select($this->paymentDetailsSql().' ORDER BY p.id DESC');

        return response()->json($this->formatPayments($rows));
    }

    public function summary()
    {
        $summary = DB::selectOne(<<<'SQL'
            SELECT
                COUNT(*) AS total_payments,
                COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_count,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_count,
                COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN 1 ELSE 0 END), 0) AS refunded_count,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) AS total_collected,
                COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN amount ELSE 0 END), 0) AS total_refunded,
                COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN amount END), 0) AS average_paid_amount,
                COALESCE(MIN(amount), 0) AS minimum_amount,
                COALESCE(MAX(amount), 0) AS maximum_amount
            FROM payments
        SQL);

        return response()->json([
            'summary' => $this->formatSummary($summary),
        ]);
    }

    public function store(Request $request)
    {
        $this->normalizeReferenceInput($request);
        $validated = $request->validate($this->rules());
        $reference = $this->normalizeReference(
            $validated['transaction_reference'] ?? null,
        );

        try {
            $payment = DB::transaction(function () use ($validated, $reference) {
                $booking = $this->lockBooking($validated['booking_id']);

                if (!$booking) {
                    throw ValidationException::withMessages([
                        'booking_id' => 'The selected booking does not exist.',
                    ]);
                }

                if (!in_array($booking->booking_status, ['Confirmed', 'Completed'], true)) {
                    throw ValidationException::withMessages([
                        'booking_id' => 'A payment can only be created for a confirmed or completed booking.',
                    ]);
                }

                if ($this->paymentExistsForBooking((int) $booking->b_id)) {
                    throw ValidationException::withMessages([
                        'booking_id' => 'This booking already has a payment record.',
                    ]);
                }

                if ($reference !== null && $this->transactionReferenceExists($reference)) {
                    throw ValidationException::withMessages([
                        'transaction_reference' => 'The transaction reference has already been taken.',
                    ]);
                }

                $status = $validated['payment_status'] ?? 'pending';

                DB::insert(
                    <<<'SQL'
                        INSERT INTO payments (
                            booking_id,
                            amount,
                            payment_method,
                            payment_status,
                            transaction_reference,
                            paid_at,
                            created_at,
                            updated_at
                        )
                        VALUES (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            CASE WHEN ? = 'paid' THEN CURRENT_TIMESTAMP ELSE NULL END,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP
                        )
                    SQL,
                    [
                        $booking->b_id,
                        $validated['amount'],
                        $validated['payment_method'],
                        $status,
                        $reference,
                        $status,
                    ],
                );

                $insertedPayment = DB::selectOne(
                    'SELECT LAST_INSERT_ID() AS payment_id',
                );

                return $this->findPayment((int) $insertedPayment->payment_id);
            }, 3);
        } catch (QueryException $error) {
            if ($this->isDuplicateKeyError($error)) {
                throw $this->duplicateStoreValidationException(
                    (int) $validated['booking_id'],
                    $reference,
                );
            }

            throw $error;
        }

        return response()->json([
            'message' => 'Payment record created successfully.',
            'payment' => $payment,
        ], 201);
    }

    public function show($payment)
    {
        $paymentRecord = $this->findPayment($payment);

        if (!$paymentRecord) {
            return $this->paymentNotFoundResponse();
        }

        return response()->json([
            'payment' => $paymentRecord,
        ]);
    }

    public function update(Request $request, $payment)
    {
        $this->normalizeReferenceInput($request);
        $validated = $request->validate($this->rules(false));
        $reference = $this->normalizeReference(
            $validated['transaction_reference'] ?? null,
        );

        try {
            $updatedPayment = DB::transaction(function () use (
                $payment,
                $validated,
                $reference,
            ) {
                $lockedPayment = $this->lockPayment($payment);

                if (!$lockedPayment) {
                    abort(404, 'Payment not found.');
                }

                if ($lockedPayment->payment_status !== 'pending') {
                    throw ValidationException::withMessages([
                        'payment' => 'Only pending payment information can be edited.',
                    ]);
                }

                if (
                    $reference !== null
                    && $this->transactionReferenceExists(
                        $reference,
                        (int) $lockedPayment->id,
                    )
                ) {
                    throw ValidationException::withMessages([
                        'transaction_reference' => 'The transaction reference has already been taken.',
                    ]);
                }

                DB::update(
                    <<<'SQL'
                        UPDATE payments
                        SET
                            amount = ?,
                            payment_method = ?,
                            transaction_reference = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    SQL,
                    [
                        $validated['amount'],
                        $validated['payment_method'],
                        $reference,
                        $lockedPayment->id,
                    ],
                );

                return $this->findPayment($lockedPayment->id);
            }, 3);
        } catch (QueryException $error) {
            if ($this->isDuplicateKeyError($error)) {
                throw ValidationException::withMessages([
                    'transaction_reference' => 'The transaction reference has already been taken.',
                ]);
            }

            throw $error;
        }

        return response()->json([
            'message' => 'Payment information updated successfully.',
            'payment' => $updatedPayment,
        ]);
    }

    public function updateStatus(Request $request, $payment)
    {
        $validated = $request->validate([
            'payment_status' => ['required', 'in:paid,refunded'],
        ]);

        $updatedPayment = DB::transaction(function () use ($payment, $validated) {
            $lockedPayment = $this->lockPayment($payment);

            if (!$lockedPayment) {
                abort(404, 'Payment not found.');
            }

            $newStatus = $validated['payment_status'];

            if ($lockedPayment->payment_status === $newStatus) {
                return $this->findPayment($lockedPayment->id);
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

            DB::update(
                <<<'SQL'
                    UPDATE payments
                    SET
                        payment_status = ?,
                        paid_at = CASE
                            WHEN ? = 'paid' AND paid_at IS NULL
                                THEN CURRENT_TIMESTAMP
                            ELSE paid_at
                        END,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                SQL,
                [
                    $newStatus,
                    $newStatus,
                    $lockedPayment->id,
                ],
            );

            return $this->findPayment($lockedPayment->id);
        }, 3);

        return response()->json([
            'message' => $updatedPayment['payment_status'] === 'paid'
                ? 'Payment marked as paid successfully.'
                : 'Payment refunded successfully.',
            'payment' => $updatedPayment,
        ]);
    }

    public function destroy($payment)
    {
        DB::transaction(function () use ($payment) {
            $lockedPayment = $this->lockPayment($payment);

            if (!$lockedPayment) {
                abort(404, 'Payment not found.');
            }

            if ($lockedPayment->payment_status !== 'pending') {
                throw ValidationException::withMessages([
                    'payment' => 'Paid and refunded payment records cannot be deleted because they are part of the financial history.',
                ]);
            }

            DB::delete(
                'DELETE FROM payments WHERE id = ?',
                [$lockedPayment->id],
            );
        }, 3);

        return response()->json([
            'message' => 'Payment record deleted successfully.',
        ]);
    }

    private function rules(bool $includeBooking = true): array
    {
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
            ],
        ];

        if ($includeBooking) {
            $rules['booking_id'] = [
                'required',
                'integer',
            ];
            $rules['payment_status'] = [
                'sometimes',
                'in:pending,paid',
            ];
        }

        return $rules;
    }

    private function lockBooking($id): ?object
    {
        return DB::selectOne(
            <<<'SQL'
                SELECT b_id, booking_status
                FROM bookings
                WHERE b_id = ?
                LIMIT 1
                FOR UPDATE
            SQL,
            [$id],
        );
    }

    private function lockPayment($id): ?object
    {
        return DB::selectOne(
            <<<'SQL'
                SELECT
                    id,
                    booking_id,
                    payment_status,
                    paid_at
                FROM payments
                WHERE id = ?
                LIMIT 1
                FOR UPDATE
            SQL,
            [$id],
        );
    }

    private function paymentExistsForBooking(int $bookingId): bool
    {
        $result = DB::selectOne(
            <<<'SQL'
                SELECT EXISTS(
                    SELECT 1
                    FROM payments
                    WHERE booking_id = ?
                ) AS payment_exists
            SQL,
            [$bookingId],
        );

        return (int) ($result->payment_exists ?? 0) === 1;
    }

    private function transactionReferenceExists(
        string $reference,
        ?int $ignoredPaymentId = null,
    ): bool {
        if ($ignoredPaymentId === null) {
            $result = DB::selectOne(
                <<<'SQL'
                    SELECT EXISTS(
                        SELECT 1
                        FROM payments
                        WHERE transaction_reference = ?
                    ) AS reference_exists
                SQL,
                [$reference],
            );
        } else {
            $result = DB::selectOne(
                <<<'SQL'
                    SELECT EXISTS(
                        SELECT 1
                        FROM payments
                        WHERE transaction_reference = ?
                          AND id <> ?
                    ) AS reference_exists
                SQL,
                [$reference, $ignoredPaymentId],
            );
        }

        return (int) ($result->reference_exists ?? 0) === 1;
    }

    private function findPayment($id): ?array
    {
        $rows = DB::select(
            $this->paymentDetailsSql().' WHERE p.id = ? LIMIT 1',
            [$id],
        );

        return isset($rows[0]) ? $this->formatPayment($rows[0]) : null;
    }

    private function paymentDetailsSql(): string
    {
        return <<<'SQL'
            SELECT
                p.id AS payment_id,
                p.booking_id AS payment_booking_id,
                p.amount AS payment_amount,
                p.payment_method,
                p.payment_status,
                p.transaction_reference,
                p.paid_at AS payment_paid_at,
                p.created_at AS payment_created_at,
                p.updated_at AS payment_updated_at,
                b.b_id AS booking_id,
                b.u_id AS booking_user_id,
                b.c_id AS booking_car_id,
                b.driver_id AS booking_driver_id,
                b.trip_type AS booking_trip_type,
                b.trip_datetime AS booking_trip_datetime,
                b.trip_duration AS booking_trip_duration,
                b.pickup AS booking_pickup,
                b.destination AS booking_destination,
                b.booking_status,
                b.created_at AS booking_created_at,
                c.id AS car_id,
                c.name AS car_name,
                c.brand AS car_brand,
                c.category AS car_category,
                c.seats AS car_seats,
                c.quantity AS car_quantity,
                c.price AS car_price,
                c.image_key AS car_image_key,
                c.image_path AS car_image_path,
                c.status AS car_status,
                c.created_at AS car_created_at,
                c.updated_at AS car_updated_at,
                d.id AS driver_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                d.license_number AS driver_license_number,
                d.experience_years AS driver_experience_years,
                d.status AS driver_status,
                d.created_at AS driver_created_at,
                d.updated_at AS driver_updated_at
            FROM payments AS p
            LEFT JOIN bookings AS b ON b.b_id = p.booking_id
            LEFT JOIN cars AS c ON c.id = b.c_id
            LEFT JOIN drivers AS d ON d.id = b.driver_id
        SQL;
    }

    private function formatPayments(array $rows): array
    {
        return array_map(
            fn (object $row): array => $this->formatPayment($row),
            $rows,
        );
    }

    private function formatPayment(object $row): array
    {
        return [
            'id' => (int) $row->payment_id,
            'booking_id' => (int) $row->payment_booking_id,
            'amount' => number_format((float) $row->payment_amount, 2, '.', ''),
            'payment_method' => $row->payment_method,
            'payment_status' => $row->payment_status,
            'transaction_reference' => $row->transaction_reference,
            'paid_at' => $row->payment_paid_at,
            'created_at' => $row->payment_created_at,
            'updated_at' => $row->payment_updated_at,
            'booking' => $this->formatBooking($row),
        ];
    }

    private function formatBooking(object $row): ?array
    {
        if ($row->booking_id === null) {
            return null;
        }

        return [
            'b_id' => (int) $row->booking_id,
            'u_id' => (int) $row->booking_user_id,
            'c_id' => (int) $row->booking_car_id,
            'driver_id' => $row->booking_driver_id === null
                ? null
                : (int) $row->booking_driver_id,
            'trip_type' => $row->booking_trip_type,
            'trip_datetime' => $row->booking_trip_datetime,
            'trip_duration' => $row->booking_trip_duration,
            'pickup' => $row->booking_pickup,
            'destination' => $row->booking_destination,
            'booking_status' => $row->booking_status,
            'created_at' => $row->booking_created_at,
            'car' => $this->formatCar($row),
            'driver' => $this->formatDriver($row),
        ];
    }

    private function formatCar(object $row): ?array
    {
        if ($row->car_id === null) {
            return null;
        }

        return [
            'id' => (int) $row->car_id,
            'name' => $row->car_name,
            'brand' => $row->car_brand,
            'category' => $row->car_category,
            'seats' => (int) $row->car_seats,
            'quantity' => (int) $row->car_quantity,
            'price' => $row->car_price,
            'image_key' => $row->car_image_key,
            'image_path' => $row->car_image_path,
            'status' => $row->car_status,
            'created_at' => $row->car_created_at,
            'updated_at' => $row->car_updated_at,
            'image_url' => $row->car_image_path
                ? Storage::disk('public')->url($row->car_image_path)
                : null,
        ];
    }

    private function formatDriver(object $row): ?array
    {
        if ($row->driver_id === null) {
            return null;
        }

        return [
            'id' => (int) $row->driver_id,
            'name' => $row->driver_name,
            'phone' => $row->driver_phone,
            'license_number' => $row->driver_license_number,
            'experience_years' => (int) $row->driver_experience_years,
            'status' => $row->driver_status,
            'created_at' => $row->driver_created_at,
            'updated_at' => $row->driver_updated_at,
        ];
    }

    private function formatSummary(object $summary): array
    {
        return [
            'total_payments' => (int) $summary->total_payments,
            'pending_count' => (int) $summary->pending_count,
            'paid_count' => (int) $summary->paid_count,
            'refunded_count' => (int) $summary->refunded_count,
            'total_collected' => number_format((float) $summary->total_collected, 2, '.', ''),
            'total_refunded' => number_format((float) $summary->total_refunded, 2, '.', ''),
            'average_paid_amount' => number_format((float) $summary->average_paid_amount, 2, '.', ''),
            'minimum_amount' => number_format((float) $summary->minimum_amount, 2, '.', ''),
            'maximum_amount' => number_format((float) $summary->maximum_amount, 2, '.', ''),
        ];
    }

    private function duplicateStoreValidationException(
        int $bookingId,
        ?string $reference,
    ): ValidationException {
        $errors = [];

        if ($this->paymentExistsForBooking($bookingId)) {
            $errors['booking_id'] = [
                'This booking already has a payment record.',
            ];
        }

        if ($reference !== null && $this->transactionReferenceExists($reference)) {
            $errors['transaction_reference'] = [
                'The transaction reference has already been taken.',
            ];
        }

        if ($errors === []) {
            $errors['payment'] = [
                'The payment conflicts with an existing payment record.',
            ];
        }

        return ValidationException::withMessages($errors);
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

    private function paymentNotFoundResponse()
    {
        return response()->json([
            'message' => 'Payment not found.',
        ], 404);
    }

    private function isDuplicateKeyError(QueryException $error): bool
    {
        return (int) ($error->errorInfo[1] ?? 0) === 1062;
    }
}
