<?php

namespace App\Http\Controllers;

use App\Services\AmbulanceRecords;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AmbulanceBookingController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pickup_district' => 'required|string|max:100',
            'pickup_thana' => 'required|string|max:100',
            'pickup_address' => 'required|string|max:500',

            'destination_district' => 'required|string|max:100',
            'destination_thana' => 'required|string|max:100',
            'destination_address' => 'required|string|max:500',

            'emergency_contact' => [
                'required',
                'string',
                'regex:/^01[3-9]\d{8}$/',
            ],
        ]);

        $booking = DB::transaction(function () use ($request, $validated) {
            DB::insert(<<<'SQL'
                INSERT INTO ambulance_bookings (
                    user_id, pickup_district, pickup_thana, pickup_address,
                    destination_district, destination_thana, destination_address,
                    emergency_contact, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            SQL, [
                $request->user()->id,
                $validated['pickup_district'], $validated['pickup_thana'], $validated['pickup_address'],
                $validated['destination_district'], $validated['destination_thana'], $validated['destination_address'],
                $validated['emergency_contact'],
            ]);

            return (new AmbulanceRecords)->renterBooking(
                DB::selectOne('SELECT * FROM ambulance_bookings WHERE id = LAST_INSERT_ID()'),
            );
        });

        return response()->json([
            'message' => 'Ambulance booking created successfully.',
            'booking' => $booking,
        ], 201);
    }

    public function index(Request $request)
    {
        $bookings = DB::select(
            'SELECT * FROM ambulance_bookings WHERE user_id = ? ORDER BY created_at DESC, id DESC',
            [$request->user()->id],
        );

        return response()->json([
            'bookings' => array_map(fn (object $booking) => (new AmbulanceRecords)->renterBooking($booking), $bookings),
        ]);
    }

    public function show(Request $request, $ambulanceBooking)
    {
        $booking = DB::selectOne('SELECT * FROM ambulance_bookings WHERE id = ?', [$ambulanceBooking]);

        if (! $booking) {
            abort(404, 'Ambulance booking not found.');
        }

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        return response()->json([
            'booking' => (new AmbulanceRecords)->renterBooking($booking),
        ]);
    }
}
