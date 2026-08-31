<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class JoinReportController extends Controller
{
    public function relationships(): JsonResponse
    {
        /*
         * INNER JOIN:
         * Returns only bookings that have a matching vehicle record.
         */
        $bookingVehicleRecords = DB::select(<<<'SQL'
            SELECT
                b.b_id AS booking_id,
                b.trip_type,
                b.pickup,
                b.destination,
                b.booking_status,
                c.id AS vehicle_id,
                c.name AS vehicle_name,
                c.brand AS vehicle_brand,
                c.category AS vehicle_category
            FROM bookings AS b
            INNER JOIN cars AS c ON c.id = b.c_id
            ORDER BY b.b_id DESC
        SQL);

        /*
         * LEFT JOIN:
         * Keeps every vehicle, including vehicles without a booking.
         */
        $fleetBookingCoverage = DB::select(<<<'SQL'
            SELECT
                c.id AS vehicle_id,
                c.name AS vehicle_name,
                c.brand AS vehicle_brand,
                c.status AS vehicle_status,
                b.b_id AS booking_id,
                b.booking_status,
                b.trip_datetime
            FROM cars AS c
            LEFT JOIN bookings AS b ON b.c_id = c.id
            ORDER BY c.id, b.b_id DESC
        SQL);

        /*
         * RIGHT JOIN:
         * Keeps every driver, including drivers without a booking.
         */
        $driverBookingCoverage = DB::select(<<<'SQL'
            SELECT
                d.id AS driver_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                d.status AS driver_status,
                b.b_id AS booking_id,
                b.booking_status,
                b.trip_datetime
            FROM bookings AS b
            RIGHT JOIN drivers AS d ON d.id = b.driver_id
            ORDER BY d.id, b.b_id DESC
        SQL);

        /*
         * FULL JOIN equivalent for MySQL:
         * MySQL has no native FULL OUTER JOIN, so a LEFT JOIN and a RIGHT
         * JOIN are combined with UNION. The result keeps unmatched records
         * from both the drivers and bookings tables.
         */
        $completeAssignmentReview = DB::select(<<<'SQL'
            SELECT
                d.id AS driver_id,
                d.name AS driver_name,
                d.status AS driver_status,
                b.b_id AS booking_id,
                b.booking_status,
                b.trip_datetime
            FROM drivers AS d
            LEFT JOIN bookings AS b ON b.driver_id = d.id

            UNION

            SELECT
                d.id AS driver_id,
                d.name AS driver_name,
                d.status AS driver_status,
                b.b_id AS booking_id,
                b.booking_status,
                b.trip_datetime
            FROM drivers AS d
            RIGHT JOIN bookings AS b ON b.driver_id = d.id

            ORDER BY driver_id, booking_id
        SQL);

        return response()->json([
            'booking_vehicle_records' => $bookingVehicleRecords,
            'fleet_booking_coverage' => $fleetBookingCoverage,
            'driver_booking_coverage' => $driverBookingCoverage,
            'complete_assignment_review' => $completeAssignmentReview,
        ]);
    }
}
