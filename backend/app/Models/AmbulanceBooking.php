<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AmbulanceBooking extends Model
{
    protected $fillable = [
        'user_id',
        'pickup_district',
        'pickup_thana',
        'pickup_address',
        'destination_district',
        'destination_thana',
        'destination_address',
        'emergency_contact',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}