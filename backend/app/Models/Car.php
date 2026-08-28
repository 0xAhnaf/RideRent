<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Car extends Model
{
    protected $appends = [
        'image_url',
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
        'status',
    ];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path
            ? Storage::disk('public')->url($this->image_path)
            : null;
    }
}
