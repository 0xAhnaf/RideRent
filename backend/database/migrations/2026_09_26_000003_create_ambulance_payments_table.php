<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
            CREATE TABLE ambulance_payments (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                ambulance_booking_id BIGINT UNSIGNED NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_method ENUM('cash', 'card', 'mobile_banking') NOT NULL,
                payment_status ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
                transaction_reference VARCHAR(100) NULL,
                paid_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT NULL,
                updated_at TIMESTAMP NULL DEFAULT NULL,
                PRIMARY KEY (id),
                UNIQUE KEY ambulance_payments_ambulance_booking_id_unique (ambulance_booking_id),
                UNIQUE KEY ambulance_payments_transaction_reference_unique (transaction_reference),
                CONSTRAINT ambulance_payments_ambulance_booking_id_foreign
                    FOREIGN KEY (ambulance_booking_id)
                    REFERENCES ambulance_bookings (id)
                    ON DELETE RESTRICT
                    ON UPDATE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);
    }

    public function down(): void
    {
        if (DB::selectOne('SELECT COUNT(*) AS total FROM ambulance_payments')->total > 0) {
            throw new RuntimeException('Cannot roll back while ambulance payment records exist.');
        }

        DB::statement('DROP TABLE IF EXISTS ambulance_payments');
    }
};
