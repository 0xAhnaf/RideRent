<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    private const ACTIVE_STATUSES = ['Pending', 'Confirmed'];

    public function store(Request $request)
            {
            $validated = $request->validate([
            'car_name' => 'required|string',
            'trip_type' => 'required|string',
            'trip_datetime' => 'required|date',
            'trip_duration' => 'required|string',
            'pickup' => 'required|string',
            'destination' => 'required|string',
        ]);

        $user = $request->user();

        $car = DB::selectOne(
            'SELECT id FROM cars WHERE name = ? LIMIT 1',
            [$validated['car_name']],
        );

        if (!$car) {
            return response()->json([
                'message' => 'Selected car was not found.',
            ], 404);
        }

        $booking = DB::transaction(function () use ($validated, $car, $user) {
            DB::insert(
                <<<'SQL'
                    INSERT INTO bookings (
                        u_id,
                        c_id,
                        driver_id,
                        trip_type,
                        trip_datetime,
                        trip_duration,
                        pickup,
                        destination,
                        booking_status,
                        created_at
                    )
                    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'Pending', CURRENT_TIMESTAMP)
                SQL,
                [
                    $user->id,
                    $car->id,
                    $validated['trip_type'],
                    $validated['trip_datetime'],
                    $validated['trip_duration'],
                    $validated['pickup'],
                    $validated['destination'],
                ],
            );

            $insertedBooking = DB::selectOne(
                'SELECT LAST_INSERT_ID() AS booking_id',
            );

            return $this->findBooking((int) $insertedBooking->booking_id);
        }, 3);

        return response()->json([
            'message' => 'Booking created successfully.',
            'booking' => $booking,
        ], 201);
    }

    public function index()
    {
        $rows = DB::select($this->bookingDetailsSql().' ORDER BY b.b_id DESC');

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

        $booking = DB::transaction(function () use ($id, $validated) {
            $lockedBooking = $this->lockBooking($id);

            if (!$lockedBooking) {
                abort(404, 'Booking not found.');
            }

            if (!in_array($lockedBooking->booking_status, self::ACTIVE_STATUSES, true)) {
                throw ValidationException::withMessages([
                    'driver_id' => 'A driver cannot be assigned to a completed or cancelled booking.',
                ]);
            }

            $driver = $this->lockDriver($validated['driver_id']);

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

            $alreadyAssignedHere = (int) $lockedBooking->driver_id === (int) $driver->id;
            $hasAnotherActiveBooking = $this->driverHasActiveBooking(
                (int) $driver->id,
                (int) $lockedBooking->b_id,
            );

            if ($hasAnotherActiveBooking || ($driver->status === 'busy' && !$alreadyAssignedHere)) {
                throw ValidationException::withMessages([
                    'driver_id' => 'The selected driver is currently busy.',
                ]);
            }

            $previousDriverId = $lockedBooking->driver_id;

            DB::update(
                'UPDATE bookings SET driver_id = ? WHERE b_id = ?',
                [$driver->id, $lockedBooking->b_id],
            );

            if ($driver->status !== 'busy') {
                DB::update(
                    "UPDATE drivers SET status = 'busy', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    [$driver->id],
                );
            }

            if ($previousDriverId && (int) $previousDriverId !== (int) $driver->id) {
                $this->synchronizeDriverAvailability((int) $previousDriverId);
            }

            return $this->findBooking($lockedBooking->b_id);
        }, 3);

        return response()->json([
            'message' => 'Driver assigned successfully.',
            'booking' => $booking,
        ]);
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
            $this->bookingDetailsSql().' WHERE b.b_id = ? LIMIT 1',
            [$id],
        );

        return isset($rows[0]) ? $this->formatBooking($rows[0]) : null;
    }

    private function bookingDetailsSql(): string
    {
        return <<<'SQL'
            SELECT
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
                d.id AS driver_record_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                d.license_number AS driver_license_number,
                d.experience_years AS driver_experience_years,
                d.status AS driver_status,
                d.created_at AS driver_created_at,
                d.updated_at AS driver_updated_at,
                p.id AS payment_id,
                p.booking_id AS payment_booking_id,
                p.amount AS payment_amount,
                p.payment_method,
                p.payment_status,
                p.transaction_reference,
                p.paid_at AS payment_paid_at,
                p.created_at AS payment_created_at,
                p.updated_at AS payment_updated_at
            FROM bookings AS b
            LEFT JOIN cars AS c ON c.id = b.c_id
            LEFT JOIN drivers AS d ON d.id = b.driver_id
            LEFT JOIN payments AS p ON p.booking_id = b.b_id
        SQL;
    }

    private function formatBookings(array $rows): array
    {
        return array_map(
            fn (object $row): array => $this->formatBooking($row),
            $rows,
        );
    }

    private function formatBooking(object $row): array
    {
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
