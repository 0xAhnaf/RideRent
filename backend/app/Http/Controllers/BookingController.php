<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'u_id' => 'required|integer',
            'car_name' => 'required|string',
            'trip_type' => 'required|string',
            'trip_datetime' => 'required|date',
            'trip_duration' => 'required|string',
            'pickup' => 'required|string',
            'destination' => 'required|string',
        ]);

        $car = Car::where('name', $request->car_name)->first();

        if (!$car) {
            return response()->json([
                'message' => 'Selected car was not found.'
            ], 404);
        }

        $booking = Booking::create([
            'u_id' => $request->u_id,
            'c_id' => $car->id,
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

    public function index()
    {
        return Booking::with('car')->get();
    }

    public function show($id)
    {
        return Booking::findOrFail($id);
    }
}