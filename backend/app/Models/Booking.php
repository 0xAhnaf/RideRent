<?php

namespace App\Models;

use App\Models\Car;
use App\Models\Driver;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $table = 'bookings';

    protected $primaryKey = 'b_id';

    public $timestamps = false;

    protected $fillable = [
        'u_id',
        'c_id',
        'driver_id',
        'trip_type',
        'trip_datetime',
        'trip_duration',
        'pickup',
        'destination',
        'booking_status',
    ];

    public function car()
    {
        return $this->belongsTo(Car::class, 'c_id', 'id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id', 'id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'booking_id', 'b_id');
    }
}
