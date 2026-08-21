<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Car extends Model
{
    protected $fillable = [
        'name',
        'brand',
        'category',
        'seats',
        'quantity',
        'price',
        'image_key',
        'image_data',
        'status',
    ];
}