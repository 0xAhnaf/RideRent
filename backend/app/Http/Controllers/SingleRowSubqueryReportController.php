<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SingleRowSubqueryReportController extends Controller
{
    public function businessInsights(): JsonResponse
    {
        /*
         * The inner query returns one vehicle ID: the vehicle with the
         * highest booking count. The outer query then returns its profile.
         */
        $customerFavoriteVehicle = DB::selectOne(<<<'SQL'
            SELECT
                c.id AS vehicle_id,
                c.name AS vehicle_name,
                c.brand AS vehicle_brand,
                c.category AS vehicle_category,
                c.seats,
                c.price,
                c.status AS vehicle_status,
                (
                    SELECT COUNT(*)
                    FROM bookings AS vehicle_bookings
                    WHERE vehicle_bookings.c_id = c.id
                ) AS booking_count
            FROM cars AS c
            WHERE c.id = (
                SELECT ranked_bookings.c_id
                FROM bookings AS ranked_bookings
                GROUP BY ranked_bookings.c_id
                ORDER BY COUNT(*) DESC, ranked_bookings.c_id ASC
                LIMIT 1
            )
        SQL);

        /*
         * The inner query returns one completed booking ID. Vehicle and
         * driver names are retrieved through scalar correlated subqueries.
         */
        $latestCompletedJourney = DB::selectOne(<<<'SQL'
            SELECT
                b.b_id AS booking_id,
                b.trip_type,
                b.trip_datetime,
                b.trip_duration,
                b.pickup,
                b.destination,
                b.booking_status,
                b.c_id AS vehicle_id,
                b.driver_id,
                (
                    SELECT c.name
                    FROM cars AS c
                    WHERE c.id = b.c_id
                ) AS vehicle_name,
                (
                    SELECT c.brand
                    FROM cars AS c
                    WHERE c.id = b.c_id
                ) AS vehicle_brand,
                (
                    SELECT d.name
                    FROM drivers AS d
                    WHERE d.id = b.driver_id
                ) AS driver_name
            FROM bookings AS b
            WHERE b.b_id = (
                SELECT completed_bookings.b_id
                FROM bookings AS completed_bookings
                WHERE completed_bookings.booking_status = 'Completed'
                ORDER BY completed_bookings.trip_datetime DESC,
                         completed_bookings.b_id DESC
                LIMIT 1
            )
        SQL);

        /*
         * The inner query returns one available driver ID, prioritising
         * experience and using the lowest ID as a stable tie-breaker.
         */
        $experiencedDriverSpotlight = DB::selectOne(<<<'SQL'
            SELECT
                d.id AS driver_id,
                d.name AS driver_name,
                d.phone,
                d.license_number,
                d.experience_years,
                d.status AS driver_status,
                (
                    SELECT COUNT(*)
                    FROM bookings AS driver_bookings
                    WHERE driver_bookings.driver_id = d.id
                ) AS assignment_count,
                (
                    SELECT COUNT(*)
                    FROM bookings AS completed_assignments
                    WHERE completed_assignments.driver_id = d.id
                      AND completed_assignments.booking_status = 'Completed'
                ) AS completed_assignments
            FROM drivers AS d
            WHERE d.id = (
                SELECT available_drivers.id
                FROM drivers AS available_drivers
                WHERE available_drivers.status = 'available'
                ORDER BY available_drivers.experience_years DESC,
                         available_drivers.id ASC
                LIMIT 1
            )
        SQL);

        return response()->json([
            'customer_favorite_vehicle' => $customerFavoriteVehicle
                ? [
                    'vehicle_id' => (int) $customerFavoriteVehicle->vehicle_id,
                    'vehicle_name' => $customerFavoriteVehicle->vehicle_name,
                    'vehicle_brand' => $customerFavoriteVehicle->vehicle_brand,
                    'vehicle_category' => $customerFavoriteVehicle->vehicle_category,
                    'seats' => (int) $customerFavoriteVehicle->seats,
                    'price' => (float) $customerFavoriteVehicle->price,
                    'vehicle_status' => $customerFavoriteVehicle->vehicle_status,
                    'booking_count' => (int) $customerFavoriteVehicle->booking_count,
                ]
                : null,
            'latest_completed_journey' => $latestCompletedJourney
                ? [
                    'booking_id' => (int) $latestCompletedJourney->booking_id,
                    'trip_type' => $latestCompletedJourney->trip_type,
                    'trip_datetime' => $latestCompletedJourney->trip_datetime,
                    'trip_duration' => $latestCompletedJourney->trip_duration,
                    'pickup' => $latestCompletedJourney->pickup,
                    'destination' => $latestCompletedJourney->destination,
                    'booking_status' => $latestCompletedJourney->booking_status,
                    'vehicle_id' => (int) $latestCompletedJourney->vehicle_id,
                    'driver_id' => $latestCompletedJourney->driver_id !== null
                        ? (int) $latestCompletedJourney->driver_id
                        : null,
                    'vehicle_name' => $latestCompletedJourney->vehicle_name,
                    'vehicle_brand' => $latestCompletedJourney->vehicle_brand,
                    'driver_name' => $latestCompletedJourney->driver_name,
                ]
                : null,
            'experienced_driver_spotlight' => $experiencedDriverSpotlight
                ? [
                    'driver_id' => (int) $experiencedDriverSpotlight->driver_id,
                    'driver_name' => $experiencedDriverSpotlight->driver_name,
                    'phone' => $experiencedDriverSpotlight->phone,
                    'license_number' => $experiencedDriverSpotlight->license_number,
                    'experience_years' => (int) $experiencedDriverSpotlight->experience_years,
                    'driver_status' => $experiencedDriverSpotlight->driver_status,
                    'assignment_count' => (int) $experiencedDriverSpotlight->assignment_count,
                    'completed_assignments' => (int) $experiencedDriverSpotlight->completed_assignments,
                ]
                : null,
        ]);
    }
}
