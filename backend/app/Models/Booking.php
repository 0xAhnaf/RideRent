<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $table = 'bookings';

    protected $primaryKey = 'b_id';

    public $timestamps = false;

    protected $fillable = [
        'u_id',
        'c_id',
        'trip_type',
        'trip_datetime',
        'trip_duration',
        'pickup',
        'destination',
        'booking_status',
    ];
}