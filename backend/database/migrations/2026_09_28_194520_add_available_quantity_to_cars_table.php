<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * Validate existing data before changing the schema.
         * A confirmed booking reserves one vehicle unit.
         */
        $invalidCars = DB::select(<<<'SQL'
            SELECT
                c.id,
                c.name,
                c.quantity,
                COUNT(b.b_id) AS confirmed_bookings
            FROM cars c
            LEFT JOIN bookings b
                ON b.c_id = c.id
                AND b.booking_status = 'Confirmed'
            GROUP BY c.id, c.name, c.quantity
            HAVING confirmed_bookings > c.quantity
        SQL);

        if (!empty($invalidCars)) {
            $details = collect($invalidCars)
                ->map(
                    fn (object $car): string =>
                        "{$car->name} (ID {$car->id}): {$car->confirmed_bookings} confirmed, {$car->quantity} total"
                )
                ->implode('; ');

            throw new RuntimeException(
                "Cannot initialize vehicle availability because confirmed bookings exceed vehicle quantity: {$details}"
            );
        }

        Schema::table('cars', function (Blueprint $table) {
        $table->unsignedInteger('available_quantity')
            ->default(0)
            ->after('quantity');
        });

        DB::statement(
            'ALTER TABLE cars ADD CONSTRAINT cars_available_quantity_check CHECK (available_quantity <= quantity)'
        );

        /*
         * Initially:
         *
         * available = total quantity - currently confirmed bookings
         */
        DB::statement(<<<'SQL'
            UPDATE cars c
            SET available_quantity =
                c.quantity - (
                    SELECT COUNT(*)
                    FROM bookings b
                    WHERE b.c_id = c.id
                      AND b.booking_status = 'Confirmed'
                )
        SQL);

        /*
         * The previous validation guarantees this condition.
         * This additional check protects the migration if the data
         * changes unexpectedly between validation and initialization.
         */
        $invalidAvailability = DB::select(<<<'SQL'
            SELECT id, name, quantity, available_quantity
            FROM cars
            WHERE available_quantity < 0
               OR available_quantity > quantity
        SQL);

        if (!empty($invalidAvailability)) {
            throw new RuntimeException(
                'Vehicle availability initialization produced an invalid quantity.'
            );
        }
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn('available_quantity');
        });
    }
};