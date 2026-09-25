<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared('
            DROP PROCEDURE IF EXISTS GetRenterProfile;

            CREATE PROCEDURE GetRenterProfile(IN p_user_id BIGINT)
            BEGIN
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    address
                FROM users
                WHERE id = p_user_id
                  AND role = "renter";
            END
        ');

        DB::unprepared('
            DROP PROCEDURE IF EXISTS GetRenterBookingStatistics;

            CREATE PROCEDURE GetRenterBookingStatistics(IN p_user_id BIGINT)
            BEGIN
                SELECT
                    COUNT(*) AS total_bookings,

                    SUM(
                        CASE
                            WHEN booking_status = "Completed" THEN 1
                            ELSE 0
                        END
                    ) AS completed_bookings,

                    SUM(
                        CASE
                            WHEN booking_status = "Cancelled" THEN 1
                            ELSE 0
                        END
                    ) AS cancelled_bookings,

                    COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            INNER JOIN bookings b2
                                ON p.booking_id = b2.b_id
                            WHERE b2.u_id = p_user_id
                              AND p.payment_status = "paid"
                        ),
                        0
                    ) AS total_spent

                FROM bookings
                WHERE u_id = p_user_id;
            END
        ');

        DB::unprepared('
    DROP PROCEDURE IF EXISTS GetRenterVehicleBookings;

    CREATE PROCEDURE GetRenterVehicleBookings(IN p_user_id BIGINT)
    BEGIN
        SELECT
            b.b_id AS booking_id,
            c.id AS vehicle_id,
            c.name AS vehicle_name,
            c.brand AS vehicle_brand,
            c.category AS vehicle_category,
            b.trip_type,
            b.trip_datetime,
            b.trip_duration,
            b.pickup,
            b.destination,
            b.booking_status,
            p.amount AS total_amount,
            p.payment_status AS payment_status
        FROM bookings b
        INNER JOIN cars c
            ON b.c_id = c.id
        LEFT JOIN payments p
            ON p.booking_id = b.b_id
        WHERE b.u_id = p_user_id
        ORDER BY b.created_at DESC;
    END
');

        DB::unprepared('
            DROP PROCEDURE IF EXISTS GetRenterAmbulanceBookings;

            CREATE PROCEDURE GetRenterAmbulanceBookings(IN p_user_id BIGINT)
            BEGIN
                SELECT
                    id AS booking_id,
                    pickup_district,
                    pickup_thana,
                    pickup_address,
                    destination_district,
                    destination_thana,
                    destination_address,
                    emergency_contact,
                    status,
                    created_at
                FROM ambulance_bookings
                WHERE user_id = p_user_id
                ORDER BY created_at DESC;
            END
        ');

        DB::unprepared('
            DROP PROCEDURE IF EXISTS GetRenterCompletedVehicleTrips;

            CREATE PROCEDURE GetRenterCompletedVehicleTrips(IN p_user_id BIGINT)
            BEGIN
                SELECT
                    b.b_id AS booking_id,
                    c.name AS vehicle_name,
                    c.brand AS vehicle_brand,
                    c.category AS vehicle_category,
                    b.trip_type,
                    b.trip_datetime,
                    b.trip_duration,
                    b.pickup,
                    b.destination,
                    COALESCE(p.amount, 0) AS payment_amount,
                    COALESCE(p.payment_method, "N/A") AS payment_method,
                    COALESCE(p.payment_status, "N/A") AS payment_status,
                    b.created_at
                FROM bookings b
                INNER JOIN cars c
                    ON b.c_id = c.id
                LEFT JOIN payments p
                    ON p.booking_id = b.b_id
                WHERE b.u_id = p_user_id
                  AND b.booking_status = "Completed"
                ORDER BY b.trip_datetime DESC;
            END
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP PROCEDURE IF EXISTS GetRenterCompletedVehicleTrips');
        DB::unprepared('DROP PROCEDURE IF EXISTS GetRenterAmbulanceBookings');
        DB::unprepared('DROP PROCEDURE IF EXISTS GetRenterVehicleBookings');
        DB::unprepared('DROP PROCEDURE IF EXISTS GetRenterBookingStatistics');
        DB::unprepared('DROP PROCEDURE IF EXISTS GetRenterProfile');
    }
};