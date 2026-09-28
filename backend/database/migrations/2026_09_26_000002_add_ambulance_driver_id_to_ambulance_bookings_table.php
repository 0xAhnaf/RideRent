<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
            ALTER TABLE ambulance_bookings
                ADD COLUMN ambulance_driver_id BIGINT UNSIGNED NULL,
                ADD KEY ambulance_bookings_ambulance_driver_id_index (ambulance_driver_id),
                ADD KEY ambulance_bookings_status_index (status),
                ADD CONSTRAINT ambulance_bookings_ambulance_driver_id_foreign
                    FOREIGN KEY (ambulance_driver_id)
                    REFERENCES ambulance_drivers (id)
                    ON DELETE RESTRICT
                    ON UPDATE RESTRICT
        SQL);
    }

    public function down(): void
    {
        if (DB::selectOne('SELECT COUNT(*) AS total FROM ambulance_bookings WHERE ambulance_driver_id IS NOT NULL')->total > 0) {
            throw new RuntimeException('Cannot roll back while ambulance driver assignments exist.');
        }

        DB::statement(<<<'SQL'
            ALTER TABLE ambulance_bookings
                DROP FOREIGN KEY ambulance_bookings_ambulance_driver_id_foreign,
                DROP INDEX ambulance_bookings_status_index,
                DROP COLUMN ambulance_driver_id
        SQL);
    }
};
