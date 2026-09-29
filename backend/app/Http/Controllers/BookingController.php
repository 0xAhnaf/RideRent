<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\BookingFareService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    private const ACTIVE_STATUSES = ['Pending', 'Confirmed'];

    public function store(Request $request, BookingFareService $fareService)
    {
        $validated = $request->validate(array_merge(BookingFareService::rules(), [
            'trip_datetime' => ['required', 'date', 'after:now'],
            'pickup_address' => ['required', 'string', 'max:200'],
            'destination_address' => ['required', 'string', 'max:200'],
            'quote_token' => ['required', 'string', 'size:64'],
        ]));
        $user = $request->user();
        $booking = DB::transaction(function () use ($validated, $fareService, $user) {
            $quote = $fareService->quote($validated, true);
            if (!hash_equals($quote['quote_token'], $validated['quote_token'])) {
                throw ValidationException::withMessages([
                    'quote_token' => 'The fare changed. Refresh the estimate and review it before booking.',
                ]);
            }
            $fare = $quote['fare'];
            $duration = $validated['trip_duration'] === 'More Than 7 Days'
                ? $fare['charged_days'].' Days' : $validated['trip_duration'];
            $pickup = trim($validated['pickup_address']).', '.$validated['pickup_thana'].', '.$validated['pickup_district'];
            $destination = trim($validated['destination_address']).', '.$validated['destination_thana'].', '.$validated['destination_district'];
            if (mb_strlen($pickup) > 255 || mb_strlen($destination) > 255) {
                throw ValidationException::withMessages(['address' => 'Address including district and thana must be at most 255 characters.']);
            }
            DB::insert(
                "INSERT INTO bookings (u_id, c_id, driver_id, trip_type, trip_datetime, trip_duration, pickup, destination, booking_status, created_at)
                 VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'Pending', CURRENT_TIMESTAMP)",
                [$user->id, $fare['car_id'], $validated['trip_type'], $validated['trip_datetime'], $duration, $pickup, $destination],
            );
            $id = (int) DB::selectOne('SELECT LAST_INSERT_ID() AS booking_id')->booking_id;
            DB::insert('INSERT INTO booking_fares (booking_id, total_fare, fare_json) VALUES (?, ?, ?)',
                [$id, $fare['total_fare'], json_encode($fare, JSON_THROW_ON_ERROR)]);
            return $this->findBooking($id);
        }, 3);
        return response()->json(['message' => 'Booking created successfully.', 'booking' => $booking], 201);
    }

    public function index()
    {
        $rows = DB::select(
            'SELECT * FROM vw_booking_details ORDER BY booking_id DESC',
        );

        return response()->json($this->formatBookings($rows));
    }

    public function show($id)
    {
        $booking = $this->findBooking($id);

        if (!$booking) {
            return $this->bookingNotFoundResponse();
        }

        return response()->json($booking);
    }

    public function assignDriver(Request $request, $id)
    {
        $validated = $request->validate([
            'driver_id' => ['required', 'integer'],
        ]);

        $booking = $this->assignDriverAtomically((int) $id, (int) $validated['driver_id']);

        return response()->json([
            'message' => 'Driver assigned successfully.',
            'booking' => $booking,
        ]);
    }

    /**
     * Atomic driver assignment (raw SQL only).
     *
     * Lock order (always the same, so concurrent requests cannot deadlock):
     *   1. booking row                      (SELECT ... FOR UPDATE)
     *   2. previous + selected driver rows  (single statement, ORDER BY id)
     *
     * Every code path that changes bookings.driver_id takes the driver lock
     * before writing, so the driver row acts as a mutex. The "active booking"
     * check below runs only after both locks are held (and no consistent read
     * has happened before that), so it sees every committed assignment.
     *
     * A deadlock / lock-wait timeout rolls back the whole attempt and retries.
     */
    private function assignDriverAtomically(int $bookingId, int $driverId): array
    {
        $maxAttempts = 3;

        for ($attempt = 1; ; $attempt++) {
            DB::beginTransaction();

            try {
                // 1. Booking lock
                $lockedBooking = $this->lockBooking($bookingId);

                if (!$lockedBooking) {
                    abort(404, 'Booking not found.');
                }

                if (!in_array($lockedBooking->booking_status, self::ACTIVE_STATUSES, true)) {
                    throw ValidationException::withMessages([
                        'driver_id' => 'A driver cannot be assigned to a completed or cancelled booking.',
                    ]);
                }

                $previousDriverId = $lockedBooking->driver_id !== null
                    ? (int) $lockedBooking->driver_id
                    : null;

                // 2. Driver lock(s), ascending id order
                $drivers = $this->lockDriversInOrder(array_filter([$previousDriverId, $driverId]));
                $driver = $drivers[$driverId] ?? null;

                if (!$driver) {
                    throw ValidationException::withMessages([
                        'driver_id' => 'The selected driver does not exist.',
                    ]);
                }

                if ($driver->status === 'inactive') {
                    throw ValidationException::withMessages([
                        'driver_id' => 'The selected driver is inactive.',
                    ]);
                }

                $alreadyAssignedHere = $previousDriverId === $driverId;

                if (
                    $this->driverHasActiveBooking($driverId, (int) $lockedBooking->b_id)
                    || ($driver->status === 'busy' && !$alreadyAssignedHere)
                ) {
                    throw ValidationException::withMessages([
                        'driver_id' => 'The selected driver is currently busy.',
                    ]);
                }

                // 3. Booking.driver_id
                if (!$alreadyAssignedHere) {
                    $updated = DB::update(
                        'UPDATE bookings SET driver_id = ? WHERE b_id = ? AND booking_status IN (\'Pending\', \'Confirmed\')',
                        [$driverId, $lockedBooking->b_id],
                    );

                    if ($updated !== 1) {
                        throw new \RuntimeException('Booking could not be updated during driver assignment.');
                    }
                }

                // 4. Selected driver -> busy
                if ($driver->status !== 'busy') {
                    $updated = DB::update(
                        "UPDATE drivers SET status = 'busy', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status <> 'inactive'",
                        [$driverId],
                    );

                    if ($updated !== 1) {
                        throw new \RuntimeException('Driver could not be updated during driver assignment.');
                    }
                }

                // 5. Previous driver -> available (only if no other active booking remains)
                if ($previousDriverId !== null && !$alreadyAssignedHere) {
                    $this->synchronizeDriverAvailability($previousDriverId);
                }

                $booking = $this->findBooking($lockedBooking->b_id);

                // 6. All steps succeeded
                DB::commit();

                return $booking;
            } catch (\Throwable $error) {
                // 7. Any failure
                DB::rollBack();

                if ($attempt < $maxAttempts && $this->isRetryableLockError($error)) {
                    usleep(random_int(20, 80) * 1000);
                    continue;
                }

                throw $error;
            }
        }
    }

    private function isRetryableLockError(\Throwable $error): bool
    {
        if (!$error instanceof QueryException) {
            return false;
        }

        // 1213 = deadlock, 1205 = lock wait timeout
        return in_array((int) ($error->errorInfo[1] ?? 0), [1213, 1205], true);
    }

    public function unassignDriver($id)
    {
        $booking = DB::transaction(function () use ($id) {
            $lockedBooking = $this->lockBooking($id);

            if (!$lockedBooking) {
                abort(404, 'Booking not found.');
            }

            if (!in_array($lockedBooking->booking_status, self::ACTIVE_STATUSES, true)) {
                throw ValidationException::withMessages([
                    'driver_id' => 'A driver cannot be removed from a completed or cancelled booking.',
                ]);
            }

            $previousDriverId = $lockedBooking->driver_id;

            if ($previousDriverId) {
                $payment = DB::selectOne(
                    'SELECT id FROM payments WHERE booking_id = ? LIMIT 1 FOR UPDATE',
                    [$lockedBooking->b_id],
                );

                if ($lockedBooking->booking_status === 'Confirmed' && $payment) {
                    throw ValidationException::withMessages([
                        'driver_id' => 'This confirmed booking has a payment record. Reassign the driver, or manage the payment before unassigning.',
                    ]);
                }

                DB::update(
                    <<<'SQL'
                        UPDATE bookings
                        SET
                            driver_id = NULL,
                            booking_status = CASE
                                WHEN booking_status = 'Confirmed' THEN 'Pending'
                                ELSE booking_status
                            END
                        WHERE b_id = ?
                    SQL,
                    [$lockedBooking->b_id],
                );

                $this->synchronizeDriverAvailability((int) $previousDriverId);
            }

            return $this->findBooking($lockedBooking->b_id);
        }, 3);

        return response()->json([
            'message' => 'Driver unassigned successfully.',
            'booking' => $booking,
        ]);
    }

    
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'booking_status' => 'required|in:Pending,Confirmed,Completed,Cancelled',
        ]);

        try {
            $booking = DB::transaction(function () use ($id, $validated) {
                $lockedBooking = $this->lockBooking($id);

                if (!$lockedBooking) {
                    abort(404, 'Booking not found.');
                }

                $currentStatus = $lockedBooking->booking_status;
                $newStatus = $validated['booking_status'];

                if ($currentStatus === $newStatus) {
                    return $this->findBooking($lockedBooking->b_id);
                }

                $allowedTransitions = [
                    'Pending' => ['Confirmed', 'Cancelled'],
                    'Confirmed' => ['Completed', 'Cancelled'],
                    'Completed' => [],
                    'Cancelled' => [],
                ];

                if (!in_array($newStatus, $allowedTransitions[$currentStatus] ?? [], true)) {
                    throw ValidationException::withMessages([
                        'booking_status' => "A {$currentStatus} booking cannot be changed to {$newStatus}.",
                    ]);
                }

                if ($newStatus === 'Confirmed' && !$lockedBooking->driver_id) {
                    throw ValidationException::withMessages([
                        'booking_status' => 'Assign an available driver before confirming this booking.',
                    ]);
                }

                if ($newStatus === 'Confirmed') {
                    $driver = $this->lockDriver($lockedBooking->driver_id);

                    if (!$driver || $driver->status === 'inactive') {
                        throw ValidationException::withMessages([
                            'booking_status' => 'The assigned driver is unavailable.',
                        ]);
                    }

                    if ($this->driverHasActiveBooking((int) $driver->id, (int) $lockedBooking->b_id)) {
                        throw ValidationException::withMessages([
                            'booking_status' => 'The assigned driver is already handling another active booking.',
                        ]);
                    }

                    if ($driver->status !== 'busy') {
                        DB::update(
                            "UPDATE drivers SET status = 'busy', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                            [$driver->id],
                        );
                    }
                }

                if ($newStatus === 'Cancelled') {
                    $payment = DB::selectOne(
                        <<<'SQL'
                            SELECT id, payment_status
                            FROM payments
                            WHERE booking_id = ?
                            LIMIT 1
                            FOR UPDATE
                        SQL,
                        [$lockedBooking->b_id],
                    );

                    if ($payment?->payment_status === 'paid') {
                        throw ValidationException::withMessages([
                            'booking_status' => 'Refund the paid payment before cancelling this booking.',
                        ]);
                    }

                    if ($payment?->payment_status === 'pending') {
                        DB::delete(
                            'DELETE FROM payments WHERE id = ?',
                            [$payment->id],
                        );
                    }
                }

                DB::update(
                    'UPDATE bookings SET booking_status = ? WHERE b_id = ?',
                    [$newStatus, $lockedBooking->b_id],
                );

                if (in_array($newStatus, ['Completed', 'Cancelled'], true) && $lockedBooking->driver_id) {
                    $this->synchronizeDriverAvailability((int) $lockedBooking->driver_id);
                }

                return $this->findBooking($lockedBooking->b_id);
            }, 3);

            return response()->json([
                'message' => 'Booking status updated successfully.',
                'booking' => $booking,
            ]);
        } catch (QueryException $error) {
            if (str_contains($error->getMessage(), 'VEHICLE_UNAVAILABLE')) {
                throw ValidationException::withMessages([
                    'booking_status' => 'This vehicle is no longer available. Please select another available vehicle.',
                ]);
            }

            throw $error;
        }
    }


    public function destroy($id)
    {
        DB::transaction(function () use ($id) {
            $lockedBooking = $this->lockBooking($id);

            if (!$lockedBooking) {
                abort(404, 'Booking not found.');
            }

            $payment = DB::selectOne(
                <<<'SQL'
                    SELECT id, payment_status
                    FROM payments
                    WHERE booking_id = ?
                    LIMIT 1
                    FOR UPDATE
                SQL,
                [$lockedBooking->b_id],
            );

            if ($payment) {
                $message = match ($payment->payment_status) {
                    'pending' => 'Cancel the booking, or delete its pending payment before deleting the booking.',
                    'paid' => 'Refund the paid payment and cancel the booking instead of deleting it.',
                    'refunded' => 'This booking has refunded payment history and cannot be deleted. Cancel it to preserve the financial record.',
                    default => 'This booking has a payment record and cannot be deleted.',
                };

                throw ValidationException::withMessages([
                    'booking' => $message,
                ]);
            }

            $driverId = $lockedBooking->driver_id;

            DB::delete(
                'DELETE FROM bookings WHERE b_id = ?',
                [$lockedBooking->b_id],
            );

            if ($driverId) {
                $this->synchronizeDriverAvailability((int) $driverId);
            }
        }, 3);

        return response()->json([
            'message' => 'Booking deleted successfully.',
        ]);
    }

    private function lockBooking($id): ?object
    {
        return DB::selectOne(
            <<<'SQL'
                SELECT
                    b_id,
                    driver_id,
                    booking_status
                FROM bookings
                WHERE b_id = ?
                LIMIT 1
                FOR UPDATE
            SQL,
            [$id],
        );
    }

    private function lockDriver($id): ?object
    {
        return DB::selectOne(
            <<<'SQL'
                SELECT id, status
                FROM drivers
                WHERE id = ?
                LIMIT 1
                FOR UPDATE
            SQL,
            [$id],
        );
    }

    /**
     * @param  array<int>  $ids
     * @return array<int, object>  driver rows keyed by id
     */
    private function lockDriversInOrder(array $ids): array
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));

        if ($ids === []) {
            return [];
        }

        $placeholders = implode(', ', array_fill(0, count($ids), '?'));

        $rows = DB::select(
            "SELECT id, status FROM drivers WHERE id IN ({$placeholders}) ORDER BY id ASC FOR UPDATE",
            $ids,
        );

        $byId = [];
        foreach ($rows as $row) {
            $byId[(int) $row->id] = $row;
        }

        return $byId;
    }

    private function driverHasActiveBooking(int $driverId, ?int $ignoredBookingId = null): bool
    {
        if ($ignoredBookingId === null) {
            $result = DB::selectOne(
                <<<'SQL'
                    SELECT EXISTS(
                        SELECT 1
                        FROM bookings
                        WHERE driver_id = ?
                          AND booking_status IN ('Pending', 'Confirmed')
                    ) AS has_active_booking
                SQL,
                [$driverId],
            );
        } else {
            $result = DB::selectOne(
                <<<'SQL'
                    SELECT EXISTS(
                        SELECT 1
                        FROM bookings
                        WHERE driver_id = ?
                          AND b_id <> ?
                          AND booking_status IN ('Pending', 'Confirmed')
                    ) AS has_active_booking
                SQL,
                [$driverId, $ignoredBookingId],
            );
        }

        return (int) ($result->has_active_booking ?? 0) === 1;
    }

    private function synchronizeDriverAvailability(int $driverId): void
    {
        $driver = $this->lockDriver($driverId);

        if (!$driver || $driver->status === 'inactive') {
            return;
        }

        $expectedStatus = $this->driverHasActiveBooking($driverId)
            ? 'busy'
            : 'available';

        if ($driver->status !== $expectedStatus) {
            DB::update(
                'UPDATE drivers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [$expectedStatus, $driverId],
            );
        }
    }

    private function findBooking($id): ?array
    {
        $rows = DB::select(
            'SELECT * FROM vw_booking_details WHERE booking_id = ? LIMIT 1',
            [$id],
        );

        return isset($rows[0]) ? $this->formatBooking($rows[0]) : null;
    }

    private function formatBookings(array $rows): array
    {
        return array_map(
            fn (object $row): array => $this->formatBooking($row),
            $rows,
        );
    }

    protected function formatBooking(object $row): array
    {
        return [
            'fare' => isset($row->booking_fare_json) ? json_decode($row->booking_fare_json, true, 512, JSON_THROW_ON_ERROR) : null,
            'total_fare' => isset($row->booking_total_fare) ? number_format((float) $row->booking_total_fare, 2, '.', '') : null,
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
            'payment' => $this->formatPayment($row),
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
        if ($row->driver_record_id === null) {
            return null;
        }

        return [
            'id' => (int) $row->driver_record_id,
            'name' => $row->driver_name,
            'phone' => $row->driver_phone,
            'license_number' => $row->driver_license_number,
            'experience_years' => (int) $row->driver_experience_years,
            'status' => $row->driver_status,
            'created_at' => $row->driver_created_at,
            'updated_at' => $row->driver_updated_at,
        ];
    }

    private function formatPayment(object $row): ?array
    {
        if ($row->payment_id === null) {
            return null;
        }

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
        ];
    }

    private function bookingNotFoundResponse()
    {
        return response()->json([
            'message' => 'Booking not found.',
        ], 404);
    }
}