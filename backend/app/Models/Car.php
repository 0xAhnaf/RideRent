<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Car extends Model
{
    protected $appends = [
        'image_url',
    ];

    protected $hidden = [
        'image_data',
    ];

    protected $fillable = [
        'name',
        'brand',
        'category',
        'seats',
        'quantity',
        'price',
        'image_key',
        'image_path',
        'image_data',
        'status',
    ];

    public function getImageUrlAttribute(): ?string
    {
        if ($this->image_path) {
            return Storage::disk('public')->url($this->image_path);
        }

        // Temporary compatibility for records created by the previous Base64 system.
        return $this->image_data ?: null;
    }
}
