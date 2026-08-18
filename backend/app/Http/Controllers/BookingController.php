<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function store(Request $request)
    {
        $booking = Booking::create([
            'u_id' => $request->u_id,
            'c_id' => $request->c_id,
            'trip_type' => $request->trip_type,
            'trip_datetime' => $request->trip_datetime,
            'trip_duration' => $request->trip_duration,
            'pickup' => $request->pickup,
            'destination' => $request->destination,
            'booking_status' => 'Pending',
        ]);

        return response()->json([
            'message' => 'Booking created successfully',
            'booking' => $booking,
        ], 201);
    }
}