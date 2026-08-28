<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Driver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    private const ACTIVE_STATUSES = ['Pending', 'Confirmed'];

    public function store(Request $request)
    {
        $validated = $request->validate([
            'u_id' => 'required|integer',
            'car_name' => 'required|string',
            'trip_type' => 'required|string',
            'trip_datetime' => 'required|date',
            'trip_duration' => 'required|string',
            'pickup' => 'required|string',
            'destination' => 'required|string',
        ]);

        $car = Car::where('name', $validated['car_name'])->first();

        if (!$car) {
            return response()->json([
                'message' => 'Selected car was not found.',
            ], 404);
        }

        $booking = Booking::create([
            'u_id' => $validated['u_id'],
            'c_id' => $car->id,
            'trip_type' => $validated['trip_type'],
            'trip_datetime' => $validated['trip_datetime'],
            'trip_duration' => $validated['trip_duration'],
            'pickup' => $validated['pickup'],
            'destination' => $validated['destination'],
            'booking_status' => 'Pending',
        ]);

        return response()->json([
            'message' => 'Booking created successfully.',
            'booking' => $booking->load(['car', 'driver']),
        ], 201);
    }

    public function index()
    {
        return Booking::with(['car', 'driver'])
            ->orderByDesc('b_id')
            ->get();
    }

    public function show($id)
    {
        return Booking::with(['car', 'driver'])->findOrFail($id);
    }

    public function assignDriver(Request $request, $id)
    {
        $validated = $request->validate([
            'driver_id' => ['required', 'integer', 'exists:drivers,id'],
        ]);

        $booking = DB::transaction(function () use ($id, $validated) {
            $booking = Booking::whereKey($id)->lockForUpdate()->firstOrFail();

            if (!in_array($booking->booking_status, self::ACTIVE_STATUSES, true)) {
                throw ValidationException::withMessages([
                    'driver_id' => 'A driver cannot be assigned to a completed or cancelled booking.',
                ]);
            }

            $driver = Driver::whereKey($validated['driver_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($driver->status === 'inactive') {
                throw ValidationException::withMessages([
                    'driver_id' => 'The selected driver is inactive.',
                ]);
            }

            $alreadyAssignedHere = (int) $booking->driver_id === (int) $driver->id;
            $hasAnotherActiveBooking = Booking::query()
                ->where('driver_id', $driver->id)
                ->where('b_id', '!=', $booking->b_id)
                ->whereIn('booking_status', self::ACTIVE_STATUSES)
                ->exists();

            if ($hasAnotherActiveBooking || ($driver->status === 'busy' && !$alreadyAssignedHere)) {
                throw ValidationException::withMessages([
                    'driver_id' => 'The selected driver is currently busy.',
                ]);
            }

            $previousDriverId = $booking->driver_id;

            $booking->driver_id = $driver->id;
            $booking->save();

            if ($driver->status !== 'busy') {
                $driver->update(['status' => 'busy']);
            }

            if ($previousDriverId && (int) $previousDriverId !== (int) $driver->id) {
                $this->synchronizeDriverAvailability((int) $previousDriverId);
            }

            return $booking->load(['car', 'driver']);
        }, 3);

        return response()->json([
            'message' => 'Driver assigned successfully.',
            'booking' => $booking,
        ]);
    }

    public function unassignDriver($id)
    {
        $booking = DB::transaction(function () use ($id) {
            $booking = Booking::whereKey($id)->lockForUpdate()->firstOrFail();

            if (!in_array($booking->booking_status, self::ACTIVE_STATUSES, true)) {
                throw ValidationException::withMessages([
                    'driver_id' => 'A driver cannot be removed from a completed or cancelled booking.',
                ]);
            }

            $previousDriverId = $booking->driver_id;

            if ($previousDriverId) {
                $booking->driver_id = null;

                if ($booking->booking_status === 'Confirmed') {
                    $booking->booking_status = 'Pending';
                }

                $booking->save();
                $this->synchronizeDriverAvailability((int) $previousDriverId);
            }

            return $booking->load(['car', 'driver']);
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
            $booking = Booking::whereKey($id)->lockForUpdate()->firstOrFail();
            $currentStatus = $booking->booking_status;
            $newStatus = $validated['booking_status'];

            if ($currentStatus === $newStatus) {
                return $booking->load(['car', 'driver']);
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

            if ($newStatus === 'Confirmed' && !$booking->driver_id) {
                throw ValidationException::withMessages([
                    'booking_status' => 'Assign an available driver before confirming this booking.',
                ]);
            }

            if ($newStatus === 'Confirmed') {
                $driver = Driver::whereKey($booking->driver_id)
                    ->lockForUpdate()
                    ->first();

                if (!$driver || $driver->status === 'inactive') {
                    throw ValidationException::withMessages([
                        'booking_status' => 'The assigned driver is unavailable.',
                    ]);
                }

                $hasAnotherActiveBooking = Booking::query()
                    ->where('driver_id', $driver->id)
                    ->where('b_id', '!=', $booking->b_id)
                    ->whereIn('booking_status', self::ACTIVE_STATUSES)
                    ->exists();

                if ($hasAnotherActiveBooking) {
                    throw ValidationException::withMessages([
                        'booking_status' => 'The assigned driver is already handling another active booking.',
                    ]);
                }

                if ($driver->status !== 'busy') {
                    $driver->update(['status' => 'busy']);
                }
            }

            $booking->booking_status = $newStatus;
            $booking->save();

            if (in_array($newStatus, ['Completed', 'Cancelled'], true) && $booking->driver_id) {
                $this->synchronizeDriverAvailability((int) $booking->driver_id);
            }

            return $booking->load(['car', 'driver']);
        }, 3);

        return response()->json([
            'message' => 'Booking status updated successfully.',
            'booking' => $booking,
        ]);
    }

    public function destroy($id)
    {
        DB::transaction(function () use ($id) {
            $booking = Booking::whereKey($id)->lockForUpdate()->firstOrFail();
            $driverId = $booking->driver_id;

            $booking->delete();

            if ($driverId) {
                $this->synchronizeDriverAvailability((int) $driverId);
            }
        }, 3);

        return response()->json([
            'message' => 'Booking deleted successfully.',
        ]);
    }

    private function synchronizeDriverAvailability(int $driverId): void
    {
        $driver = Driver::whereKey($driverId)->lockForUpdate()->first();

        if (!$driver || $driver->status === 'inactive') {
            return;
        }

        $hasActiveBooking = Booking::query()
            ->where('driver_id', $driverId)
            ->whereIn('booking_status', self::ACTIVE_STATUSES)
            ->exists();

        $expectedStatus = $hasActiveBooking ? 'busy' : 'available';

        if ($driver->status !== $expectedStatus) {
            $driver->update(['status' => $expectedStatus]);
        }
    }
}
