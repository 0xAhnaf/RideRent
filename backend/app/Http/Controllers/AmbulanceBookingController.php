<?php

namespace App\Http\Controllers;

use App\Models\AmbulanceBooking;
use Illuminate\Http\Request;

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

        $booking = AmbulanceBooking::create([
            'user_id' => $request->user()->id,

            'pickup_district' => $validated['pickup_district'],
            'pickup_thana' => $validated['pickup_thana'],
            'pickup_address' => $validated['pickup_address'],

            'destination_district' => $validated['destination_district'],
            'destination_thana' => $validated['destination_thana'],
            'destination_address' => $validated['destination_address'],

            'emergency_contact' => $validated['emergency_contact'],

            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Ambulance booking created successfully.',
            'booking' => $booking,
        ], 201);
    }

    public function index(Request $request)
    {
        $bookings = AmbulanceBooking::where(
            'user_id',
            $request->user()->id
        )
            ->latest()
            ->get();

        return response()->json([
            'bookings' => $bookings,
        ]);
    }

    public function show(Request $request, AmbulanceBooking $ambulanceBooking)
    {
        if ($ambulanceBooking->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        return response()->json([
            'booking' => $ambulanceBooking,
        ]);
    }
}