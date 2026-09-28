<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
            CREATE TABLE ambulance_drivers (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                license_number VARCHAR(100) NOT NULL,
                experience_years TINYINT UNSIGNED NOT NULL DEFAULT 0,
                status ENUM('available', 'busy', 'inactive') NOT NULL DEFAULT 'available',
                created_at TIMESTAMP NULL DEFAULT NULL,
                updated_at TIMESTAMP NULL DEFAULT NULL,
                PRIMARY KEY (id),
                UNIQUE KEY ambulance_drivers_phone_unique (phone),
                UNIQUE KEY ambulance_drivers_license_number_unique (license_number),
                KEY ambulance_drivers_status_index (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);
    }

    public function down(): void
    {
        if (DB::selectOne('SELECT COUNT(*) AS total FROM ambulance_drivers')->total > 0) {
            throw new RuntimeException('Cannot roll back while ambulance driver records exist.');
        }

        DB::statement('DROP TABLE IF EXISTS ambulance_drivers');
    }
};
