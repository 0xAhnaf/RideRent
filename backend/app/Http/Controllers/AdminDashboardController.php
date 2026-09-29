<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
   public function index(): JsonResponse
{
    $totalUsers = DB::selectOne(<<<'SQL'
        SELECT COUNT(*) AS total_users
        FROM users
        WHERE role = 'renter'
    SQL);

    $totalVehicles = DB::selectOne(<<<'SQL'
        SELECT COALESCE(SUM(quantity), 0) AS total_vehicle_units
        FROM cars
    SQL);

    $totalAvailableVehicles = DB::selectOne(<<<'SQL'
        SELECT COALESCE(SUM(available_quantity), 0) AS total_available_vehicle_units
        FROM cars
    SQL);

    $activeBookings = DB::selectOne(<<<'SQL'
        SELECT COUNT(*) AS active_bookings
        FROM bookings
        WHERE booking_status IN ('Pending', 'Confirmed')
    SQL);

    $pendingAmbulance = DB::selectOne(<<<'SQL'
        SELECT COUNT(*) AS pending_ambulance
        FROM ambulance_bookings
        WHERE status = 'pending'
    SQL);

    $monthlyRevenue = DB::selectOne(<<<'SQL'
        SELECT COALESCE(SUM(amount), 0) AS monthly_revenue
        FROM payments
        WHERE payment_status = 'paid'
          AND paid_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
          AND paid_at < DATE_ADD(
              DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'),
              INTERVAL 1 MONTH
          )
    SQL);

    return response()->json([
        'stats' => [
            [
                'title' => 'Total Users',
                'value' => (int) ($totalUsers->total_users ?? 0),
                'type' => 'normal',
                'icon' => '👥',
            ],
            [
                'title' => 'Total Vehicles',
                'value' => (int) ($totalVehicles->total_vehicle_units ?? 0),
                'type' => 'normal',
                'icon' => '🚗',
            ],
            [
                'title' => 'Available Vehicles',
                'value' => (int) ($totalAvailableVehicles->total_available_vehicle_units ?? 0),
                'type' => 'active',
                'icon' => '🚙',
            ],
            [
                'title' => 'Active Bookings',
                'value' => (int) ($activeBookings->active_bookings ?? 0),
                'type' => 'active',
                'icon' => '📋',
            ],
            [
                'title' => 'Pending Ambulance',
                'value' => (int) ($pendingAmbulance->pending_ambulance ?? 0),
                'type' => 'danger',
                'icon' => '🚑',
            ],
            [
                'title' => 'Monthly Revenue',
                'value' => (float) ($monthlyRevenue->monthly_revenue ?? 0),
                'type' => 'normal',
                'icon' => '💰',
            ],
        ],
    ]);
}
}