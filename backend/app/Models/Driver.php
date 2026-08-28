<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'license_number',
        'experience_years',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'experience_years' => 'integer',
        ];
    }
}
