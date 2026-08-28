<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('cars', 'image_data')) {
            return;
        }

        $legacyVehicleNames = DB::table('cars')
            ->whereNotNull('image_data')
            ->pluck('name')
            ->all();

        if ($legacyVehicleNames !== []) {
            throw new \RuntimeException(
                'Cannot remove cars.image_data because these vehicles still use Base64 images: '
                .implode(', ', $legacyVehicleNames)
                .'. Re-upload their images from Edit Vehicle, then run php artisan migrate again.'
            );
        }

        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn('image_data');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('cars', 'image_data')) {
            return;
        }

        Schema::table('cars', function (Blueprint $table) {
            $table->longText('image_data')
                ->nullable()
                ->after('image_path');
        });
    }
};
