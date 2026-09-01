<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\PaymentController;

use App\Http\Controllers\AggregateReportController;
use App\Http\Controllers\JoinReportController;
use App\Http\Controllers\SingleRowSubqueryReportController;
use App\Http\Controllers\MultipleRowSubqueryReportController;


/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
|
| These routes do not require authentication.
|
*/


/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
|
| Anyone can register or attempt to log in.
|
*/

Route::post('/register', [AuthController::class, 'register']);

Route::post('/login', [AuthController::class, 'login']);


/*
|--------------------------------------------------------------------------
| PUBLIC VEHICLE VIEWING
|--------------------------------------------------------------------------
|
| Visitors can see available cars.
|
*/

Route::get('/cars', [CarController::class, 'index']);

Route::get('/cars/{id}', [CarController::class, 'show']);



/*
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTES
|--------------------------------------------------------------------------
|
| Everything below requires a valid Laravel/Sanctum session.
|
*/

Route::middleware('auth:sanctum')->group(function () {


    /*
    |--------------------------------------------------------------------------
    | CURRENT USER
    |--------------------------------------------------------------------------
    */

    Route::get('/user', [AuthController::class, 'user']);


    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    Route::post('/logout', [AuthController::class, 'logout']);


    /*
    |--------------------------------------------------------------------------
    | RENTER / GENERAL USER
    |--------------------------------------------------------------------------
    |
    | Routes that normal Renters are allowed to use.
    |
    | IMPORTANT:
    | If you add a new feature that a Renter should be able to use,
    | add its route inside this section.
    |
    */

    Route::post('/bookings', [BookingController::class, 'store']);

    Route::get('/bookings', [BookingController::class, 'index']);

    Route::get('/bookings/{id}', [BookingController::class, 'show']);

    Route::put('/bookings/{id}', [BookingController::class, 'update']);

    Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);



    /*
    |--------------------------------------------------------------------------
    | ADMIN ONLY
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Every route inside this group requires:
    |
    | 1. A logged-in user
    | 2. role = "admin"
    |
    | A Renter will receive HTTP 403 Forbidden.
    |
    | If you create a new Admin-only API in the future,
    | add it INSIDE this group.
    |
    */

    Route::middleware('admin')->group(function () {


        /*
        |--------------------------------------------------------------------------
        | VEHICLE MANAGEMENT
        |--------------------------------------------------------------------------
        |
        | Viewing cars is public.
        |
        | Creating, updating and deleting cars is Admin-only.
        |
        */

        Route::post('/cars', [CarController::class, 'store']);

        Route::put('/cars/{id}', [CarController::class, 'update']);

        Route::delete('/cars/{id}', [CarController::class, 'destroy']);


        /*
        |--------------------------------------------------------------------------
        | ADMIN VEHICLE ENDPOINT
        |--------------------------------------------------------------------------
        |
        | Kept because your existing frontend may already use this URL.
        |
        */

        Route::post('/admin/vehicles', [CarController::class, 'store']);



        /*
        |--------------------------------------------------------------------------
        | DRIVER MANAGEMENT
        |--------------------------------------------------------------------------
        */

        Route::apiResource('drivers', DriverController::class);



        /*
        |--------------------------------------------------------------------------
        | BOOKING MANAGEMENT
        |--------------------------------------------------------------------------
        |
        | Admin-specific booking operations.
        |
        */

        Route::put(
            '/bookings/{id}/driver',
            [BookingController::class, 'assignDriver']
        );

        Route::delete(
            '/bookings/{id}/driver',
            [BookingController::class, 'unassignDriver']
        );



        /*
        |--------------------------------------------------------------------------
        | PAYMENT MANAGEMENT
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/payments/summary',
            [PaymentController::class, 'summary']
        );

        Route::patch(
            '/payments/{payment}/status',
            [PaymentController::class, 'updateStatus']
        );

        Route::apiResource('payments', PaymentController::class);



        /*
        |--------------------------------------------------------------------------
        | ADMIN REPORTS
        |--------------------------------------------------------------------------
        |
        | These reports contain business/database information
        | intended for the Admin dashboard.
        |
        */

        Route::get(
            '/reports/summary',
            [AggregateReportController::class, 'summary']
        );

        Route::get(
            '/reports/relationships',
            [JoinReportController::class, 'relationships']
        );

        Route::get(
            '/reports/business-insights',
            [SingleRowSubqueryReportController::class, 'businessInsights']
        );

        Route::get(
            '/reports/fleet-opportunities',
            [MultipleRowSubqueryReportController::class, 'fleetOpportunities']
        );

    });

});