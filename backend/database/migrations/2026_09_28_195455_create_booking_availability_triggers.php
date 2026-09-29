<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_bookings_after_insert_availability
            AFTER INSERT ON bookings
            FOR EACH ROW
            BEGIN
                IF NEW.booking_status = 'Confirmed' THEN
                    UPDATE cars
                    SET available_quantity = available_quantity - 1
                    WHERE id = NEW.c_id
                      AND available_quantity > 0
                      AND status = 'available';

                    IF ROW_COUNT() = 0 THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'VEHICLE_UNAVAILABLE';
                    END IF;
                END IF;
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_bookings_after_update_availability
            AFTER UPDATE ON bookings
            FOR EACH ROW
            BEGIN
                IF OLD.booking_status <> 'Confirmed'
                   AND NEW.booking_status = 'Confirmed' THEN

                    IF OLD.c_id <> NEW.c_id THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'CONFIRMED_BOOKING_CAR_CHANGE_NOT_ALLOWED';
                    END IF;

                    UPDATE cars
                    SET available_quantity = available_quantity - 1
                    WHERE id = NEW.c_id
                      AND available_quantity > 0
                      AND status = 'available';

                    IF ROW_COUNT() = 0 THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'VEHICLE_UNAVAILABLE';
                    END IF;

                ELSEIF OLD.booking_status = 'Confirmed'
                   AND NEW.booking_status <> 'Confirmed' THEN

                    IF OLD.c_id <> NEW.c_id THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'CONFIRMED_BOOKING_CAR_CHANGE_NOT_ALLOWED';
                    END IF;

                    UPDATE cars
                    SET available_quantity = available_quantity + 1
                    WHERE id = OLD.c_id
                      AND available_quantity < quantity;

                ELSEIF OLD.booking_status = 'Confirmed'
                   AND NEW.booking_status = 'Confirmed'
                   AND OLD.c_id <> NEW.c_id THEN

                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'CONFIRMED_BOOKING_CAR_CHANGE_NOT_ALLOWED';
                END IF;
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_bookings_after_delete_availability
            AFTER DELETE ON bookings
            FOR EACH ROW
            BEGIN
                IF OLD.booking_status = 'Confirmed' THEN
                    UPDATE cars
                    SET available_quantity = available_quantity + 1
                    WHERE id = OLD.c_id
                      AND available_quantity < quantity;
                END IF;
            END
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(
            'DROP TRIGGER IF EXISTS trg_bookings_after_delete_availability'
        );

        DB::unprepared(
            'DROP TRIGGER IF EXISTS trg_bookings_after_update_availability'
        );

        DB::unprepared(
            'DROP TRIGGER IF EXISTS trg_bookings_after_insert_availability'
        );
    }
};