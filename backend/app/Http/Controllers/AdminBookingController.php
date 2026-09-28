<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class AdminBookingController extends BookingController
{
    public function index()
    {
        $rows = DB::select('SELECT * FROM vw_booking_details ORDER BY booking_id DESC');

        return response()->json(array_map(
            fn (object $row): array => $this->adminBooking($row),
            $rows,
        ));
    }

    public function show($id)
    {
        $row = DB::selectOne(
            'SELECT * FROM vw_booking_details WHERE booking_id = ? LIMIT 1',
            [$id],
        );

        if (!$row) {
            return response()->json(['message' => 'Booking not found.'], 404);
        }

        return response()->json($this->adminBooking($row));
    }

    private function adminBooking(object $row): array
    {
        return array_merge($this->formatBooking($row), [
            'customer_name' => $row->customer_name,
            'customer_phone' => $row->customer_phone,
        ]);
    }
}
