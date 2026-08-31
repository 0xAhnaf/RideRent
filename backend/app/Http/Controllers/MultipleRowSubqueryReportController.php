<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MultipleRowSubqueryReportController extends Controller
{
    public function fleetOpportunities(): JsonResponse
    {
        /*
         * IN receives multiple vehicle IDs from active bookings and returns
         * the fleet records that currently have customer demand.
         */
        $activeDemandFleet = DB::select(<<<'SQL'
            SELECT
                c.id AS vehicle_id,
                c.name AS vehicle_name,
                c.brand AS vehicle_brand,
                c.category AS vehicle_category,
                c.seats,
                c.quantity,
                c.price,
                c.status AS vehicle_status,
                (
                    SELECT COUNT(*)
                    FROM bookings AS active_count
                    WHERE active_count.c_id = c.id
                      AND active_count.booking_status IN ('Pending', 'Confirmed')
                ) AS active_booking_count
            FROM cars AS c
            WHERE c.id IN (
                SELECT active_bookings.c_id
                FROM bookings AS active_bookings
                WHERE active_bookings.booking_status IN ('Pending', 'Confirmed')
            )
            ORDER BY active_booking_count DESC, c.name ASC, c.id ASC
        SQL);

        /*
         * ANY compares each available candidate with the multiple seat values
         * returned for actively booked vehicles. A candidate qualifies when
         * it is larger than at least one of those active-demand vehicles.
         */
        $higherCapacityAlternatives = DB::select(<<<'SQL'
            SELECT
                candidate.id AS vehicle_id,
                candidate.name AS vehicle_name,
                candidate.brand AS vehicle_brand,
                candidate.category AS vehicle_category,
                candidate.seats,
                candidate.quantity,
                candidate.price,
                candidate.status AS vehicle_status
            FROM cars AS candidate
            WHERE candidate.status = 'available'
              AND candidate.id NOT IN (
                  SELECT reserved_bookings.c_id
                  FROM bookings AS reserved_bookings
                  WHERE reserved_bookings.booking_status IN ('Pending', 'Confirmed')
              )
              AND candidate.seats > ANY (
                  SELECT active_vehicle.seats
                  FROM cars AS active_vehicle
                  WHERE active_vehicle.id IN (
                      SELECT active_bookings.c_id
                      FROM bookings AS active_bookings
                      WHERE active_bookings.booking_status IN ('Pending', 'Confirmed')
                  )
              )
            ORDER BY candidate.seats DESC, candidate.price ASC, candidate.id ASC
        SQL);

        /*
         * ALL compares each available vehicle with every available seat value.
         * The matching records represent the fleet's maximum-capacity options.
         */
        $maximumCapacityFleet = DB::select(<<<'SQL'
            SELECT
                c.id AS vehicle_id,
                c.name AS vehicle_name,
                c.brand AS vehicle_brand,
                c.category AS vehicle_category,
                c.seats,
                c.quantity,
                c.price,
                c.status AS vehicle_status
            FROM cars AS c
            WHERE c.status = 'available'
              AND c.seats >= ALL (
                  SELECT comparison_vehicle.seats
                  FROM cars AS comparison_vehicle
                  WHERE comparison_vehicle.status = 'available'
              )
            ORDER BY c.price ASC, c.name ASC, c.id ASC
        SQL);

        return response()->json([
            'active_demand_fleet' => $this->formatVehicles(
                $activeDemandFleet,
                includeActiveBookings: true,
            ),
            'higher_capacity_alternatives' => $this->formatVehicles(
                $higherCapacityAlternatives,
            ),
            'maximum_capacity_fleet' => $this->formatVehicles(
                $maximumCapacityFleet,
            ),
        ]);
    }

    private function formatVehicles(
        array $vehicles,
        bool $includeActiveBookings = false,
    ): array {
        return array_map(
            static function (object $vehicle) use ($includeActiveBookings): array {
                $formatted = [
                    'vehicle_id' => (int) $vehicle->vehicle_id,
                    'vehicle_name' => $vehicle->vehicle_name,
                    'vehicle_brand' => $vehicle->vehicle_brand,
                    'vehicle_category' => $vehicle->vehicle_category,
                    'seats' => (int) $vehicle->seats,
                    'quantity' => (int) $vehicle->quantity,
                    'price' => (float) $vehicle->price,
                    'vehicle_status' => $vehicle->vehicle_status,
                ];

                if ($includeActiveBookings) {
                    $formatted['active_booking_count'] = (int) $vehicle->active_booking_count;
                }

                return $formatted;
            },
            $vehicles,
        );
    }
}
