<?php

namespace App\Http\Controllers;

use App\Services\AmbulanceRecords;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminAmbulanceBookingController extends Controller
{
    public function index()
    {
        return response()->json(['bookings' => (new AmbulanceRecords)->bookings()]);
    }

    public function show(int $id)
    {
        return response()->json(['booking' => (new AmbulanceRecords)->booking($id)]);
    }

    public function assignDriver(Request $request, int $id)
    {
        $data = $request->validate(['ambulance_driver_id' => ['required', 'integer', 'min:1']]);

        return $this->changeDriver($id, (int) $data['ambulance_driver_id']);
    }

    public function unassignDriver(int $id)
    {
        return $this->changeDriver($id, null);
    }

    private function changeDriver(int $id, ?int $driverId)
    {
        $records = new AmbulanceRecords;
        $booking = DB::transaction(function () use ($records, $id, $driverId) {
            $booking = $records->lockBooking($id);

            if (! in_array($booking->status, ['pending', 'confirmed'], true)) {
                throw ValidationException::withMessages(['ambulance_driver_id' => 'Only active ambulance bookings can change drivers.']);
            }

            $oldDriverId = $booking->ambulance_driver_id === null ? null : (int) $booking->ambulance_driver_id;
            if ($driverId === $oldDriverId) {
                return $records->booking($id);
            }

            if ($driverId === null && $booking->status === 'confirmed') {
                throw ValidationException::withMessages(['ambulance_driver_id' => 'A confirmed booking must have a driver. Assign a replacement driver instead.']);
            }

            // Lock driver rows in ID order when replacing an assignment.
            $driverIds = array_unique(array_filter([$oldDriverId, $driverId]));
            sort($driverIds);
            foreach ($driverIds as $lockedId) {
                $records->lockDriver($lockedId);
            }

            if ($driverId !== null) {
                $driver = $records->lockDriver($driverId);
                if ($driver->status !== 'available' || $records->driverHasActiveBooking($driverId)) {
                    throw ValidationException::withMessages(['ambulance_driver_id' => 'The selected ambulance driver is unavailable.']);
                }
                DB::update("UPDATE ambulance_drivers SET status = 'busy', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [$driverId]);
            }

            DB::update('UPDATE ambulance_bookings SET ambulance_driver_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [$driverId, $id]);
            $records->releaseDriver($oldDriverId);

            return $records->booking($id);
        }, 3);

        return response()->json(['message' => 'Driver assignment updated successfully.', 'booking' => $booking]);
    }

    public function updateStatus(Request $request, int $id)
    {
        $data = $request->validate(['status' => ['required', 'in:pending,confirmed,completed,cancelled']]);
        $records = new AmbulanceRecords;

        $booking = DB::transaction(function () use ($records, $id, $data) {
            $booking = $records->lockBooking($id);
            $status = $data['status'];
            if ($status === $booking->status) {
                return $records->booking($id);
            }

            $transitions = [
                'pending' => ['confirmed', 'cancelled'],
                'confirmed' => ['completed', 'cancelled'],
                'completed' => [],
                'cancelled' => [],
            ];
            if (! in_array($status, $transitions[$booking->status] ?? [], true)) {
                throw ValidationException::withMessages(['status' => "A {$booking->status} booking cannot be changed to {$status}."]);
            }

            if ($status === 'confirmed') {
                if (! $booking->ambulance_driver_id) {
                    throw ValidationException::withMessages(['status' => 'Assign an available driver before confirming this booking.']);
                }
                $driver = $records->lockDriver((int) $booking->ambulance_driver_id);
                if ($driver->status === 'inactive') {
                    throw ValidationException::withMessages(['status' => 'The assigned driver is unavailable.']);
                }
            }

            if ($status === 'cancelled') {
                $payment = DB::selectOne('SELECT * FROM ambulance_payments WHERE ambulance_booking_id = ? FOR UPDATE', [$id]);
                if ($payment?->payment_status === 'paid') {
                    throw ValidationException::withMessages(['status' => 'Refund the paid payment before cancelling this booking.']);
                }
                // Preserve pending financial records until explicitly removed by an admin.
                if ($payment?->payment_status === 'pending') {
                    throw ValidationException::withMessages(['status' => 'Remove the pending payment before cancelling this booking.']);
                }
            }

            DB::update('UPDATE ambulance_bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [$status, $id]);
            if (in_array($status, ['completed', 'cancelled'], true)) {
                $records->releaseDriver($booking->ambulance_driver_id === null ? null : (int) $booking->ambulance_driver_id);
            }

            return $records->booking($id);
        }, 3);

        return response()->json(['message' => 'Booking status updated successfully.', 'booking' => $booking]);
    }
}
