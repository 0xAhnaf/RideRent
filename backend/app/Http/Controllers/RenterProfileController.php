<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RenterProfileController extends Controller
{
    public function profile(Request $request)
    {
        $userId = $request->user()->id;

        $result = DB::select(
            'CALL GetRenterProfile(?)',
            [$userId]
        );

        return response()->json($result);
    }

    public function bookingStatistics(Request $request)
    {
        $userId = $request->user()->id;

        $result = DB::select(
            'CALL GetRenterBookingStatistics(?)',
            [$userId]
        );

        return response()->json($result);
    }

    public function vehicleBookings(Request $request)
    {
        $userId = $request->user()->id;

        $result = DB::select(
            'CALL GetRenterVehicleBookings(?)',
            [$userId]
        );

        return response()->json($result);
    }

    public function ambulanceBookings(Request $request)
    {
        $userId = $request->user()->id;

        $result = DB::select(
            'CALL GetRenterAmbulanceBookings(?)',
            [$userId]
        );

        return response()->json($result);
    }

    public function completedVehicleTrips(Request $request)
{
    $userId = $request->user()->id;

    $result = DB::select(
        'CALL GetRenterCompletedVehicleTrips(?)',
        [$userId]
    );

    return response()->json($result);
}
}