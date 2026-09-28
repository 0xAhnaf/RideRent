<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
            CREATE OR REPLACE VIEW vw_booking_details AS
            SELECT
                b.b_id AS booking_id,
                b.u_id AS booking_user_id,
                u.name AS customer_name,
                u.phone AS customer_phone,
                b.c_id AS booking_car_id,
                b.driver_id AS booking_driver_id,
                b.trip_type AS booking_trip_type,
                b.trip_datetime AS booking_trip_datetime,
                b.trip_duration AS booking_trip_duration,
                b.pickup AS booking_pickup,
                b.destination AS booking_destination,
                b.booking_status,
                b.created_at AS booking_created_at,
                c.id AS car_id,
                c.name AS car_name,
                c.brand AS car_brand,
                c.category AS car_category,
                c.seats AS car_seats,
                c.quantity AS car_quantity,
                c.price AS car_price,
                c.image_key AS car_image_key,
                c.image_path AS car_image_path,
                c.status AS car_status,
                c.created_at AS car_created_at,
                c.updated_at AS car_updated_at,
                d.id AS driver_record_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                d.license_number AS driver_license_number,
                d.experience_years AS driver_experience_years,
                d.status AS driver_status,
                d.created_at AS driver_created_at,
                d.updated_at AS driver_updated_at,
                p.id AS payment_id,
                p.booking_id AS payment_booking_id,
                p.amount AS payment_amount,
                p.payment_method,
                p.payment_status,
                p.transaction_reference,
                p.paid_at AS payment_paid_at,
                p.created_at AS payment_created_at,
                p.updated_at AS payment_updated_at
            FROM bookings AS b
            LEFT JOIN users AS u ON u.id = b.u_id
            LEFT JOIN cars AS c ON c.id = b.c_id
            LEFT JOIN drivers AS d ON d.id = b.driver_id
            LEFT JOIN payments AS p ON p.booking_id = b.b_id
        SQL);
    }

    public function down(): void
    {
        $previous = require __DIR__.'/2026_09_26_000004_create_booking_details_view.php';
        $previous->up();
    }
};
