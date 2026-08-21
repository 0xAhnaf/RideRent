<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\BookingController;

<<<<<<< Updated upstream
=======
/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
>>>>>>> Stashed changes
Route::get('/cars', [CarController::class, 'index']);
Route::get('/cars/{id}', [CarController::class, 'show']);

Route::post('/cars', [CarController::class, 'store']);

Route::post('/admin/vehicles', [CarController::class, 'store']);

Route::put('/cars/{id}', [CarController::class, 'update']);


/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

<<<<<<< Updated upstream
Route::get('/bookings', [BookingController::class, 'index']);
Route::get('/bookings/{id}', [BookingController::class, 'show']);
=======
Route::middleware('auth:sanctum')->group(function () {

    // Authenticated User
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Bookings
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::put('/bookings/{id}', [BookingController::class, 'update']);
    Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);
    Route::post('/logout', [AuthController::class, 'logout']);
});
>>>>>>> Stashed changes
