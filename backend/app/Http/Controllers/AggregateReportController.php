<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AggregateReportController extends Controller
{
    public function summary(): JsonResponse
    {
        $fleetSummary = DB::table('cars')
            ->selectRaw('COUNT(*) AS vehicle_models')
            ->selectRaw('COALESCE(SUM(quantity), 0) AS total_vehicle_units')
            ->first();

        $bookingSummary = DB::table('bookings')
            ->selectRaw('COUNT(*) AS total_bookings')
            ->first();

        $driverSummary = DB::table('drivers')
            ->selectRaw('COUNT(*) AS total_drivers')
            ->first();

        $paymentSummary = DB::table('payments')
            ->selectRaw('COUNT(*) AS total_payments')
            ->selectRaw("SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_payments")
            ->selectRaw("COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue")
            ->selectRaw("COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN amount END), 0) AS average_payment")
            ->selectRaw("MIN(CASE WHEN payment_status = 'paid' THEN amount END) AS minimum_payment")
            ->selectRaw("MAX(CASE WHEN payment_status = 'paid' THEN amount END) AS maximum_payment")
            ->first();

        /*
         * MySQL does not provide FIRST() and LAST() aggregate functions.
         * ORDER BY with LIMIT 1 is the MySQL equivalent for retrieving the
         * first and latest booking records.
         */
        $firstBooking = DB::table('bookings')
            ->select(['b_id', 'booking_status', 'created_at'])
            ->orderBy('created_at')
            ->orderBy('b_id')
            ->first();

        $latestBooking = DB::table('bookings')
            ->select(['b_id', 'booking_status', 'created_at'])
            ->orderByDesc('created_at')
            ->orderByDesc('b_id')
            ->first();

        return response()->json([
            'overview' => [
                'vehicle_models' => (int) ($fleetSummary->vehicle_models ?? 0),
                'total_vehicle_units' => (int) ($fleetSummary->total_vehicle_units ?? 0),
                'total_drivers' => (int) ($driverSummary->total_drivers ?? 0),
                'total_bookings' => (int) ($bookingSummary->total_bookings ?? 0),
                'total_payments' => (int) ($paymentSummary->total_payments ?? 0),
            ],
            'payment_overview' => [
                'paid_payments' => (int) ($paymentSummary->paid_payments ?? 0),
                'total_revenue' => (float) ($paymentSummary->total_revenue ?? 0),
                'average_payment' => (float) ($paymentSummary->average_payment ?? 0),
                'minimum_payment' => $paymentSummary->minimum_payment !== null
                    ? (float) $paymentSummary->minimum_payment
                    : null,
                'maximum_payment' => $paymentSummary->maximum_payment !== null
                    ? (float) $paymentSummary->maximum_payment
                    : null,
            ],
            'booking_timeline' => [
                'first_booking' => $firstBooking,
                'latest_booking' => $latestBooking,
            ],
        ]);
    }
}
