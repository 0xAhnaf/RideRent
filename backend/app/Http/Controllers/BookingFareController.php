<?php

namespace App\Http\Controllers;

use App\Services\BookingFareService;
use Illuminate\Http\Request;

class BookingFareController extends Controller
{
    public function show(Request $request, BookingFareService $service)
    {
        return response()->json($service->quote($request->validate(BookingFareService::rules())))
            ->header('Cache-Control', 'no-store');
    }
}
