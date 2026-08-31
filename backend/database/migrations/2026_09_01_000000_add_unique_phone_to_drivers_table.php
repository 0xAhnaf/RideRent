<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $duplicatePhones = DB::select(<<<'SQL'
            SELECT
                phone,
                COUNT(*) AS duplicate_count
            FROM drivers
            GROUP BY phone
            HAVING COUNT(*) > 1
            ORDER BY phone ASC
        SQL);

        if ($duplicatePhones !== []) {
            $phones = array_map(
                static fn (object $duplicate): string => $duplicate->phone,
                $duplicatePhones,
            );

            throw new \RuntimeException(
                'Cannot add a unique driver phone index. Resolve duplicate phone numbers first: '
                .implode(', ', $phones),
            );
        }

        $index = DB::selectOne(<<<'SQL'
            SELECT COUNT(*) AS index_count
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'drivers'
              AND index_name = 'drivers_phone_unique'
        SQL);

        if ((int) ($index->index_count ?? 0) === 0) {
            DB::statement(<<<'SQL'
                ALTER TABLE drivers
                ADD UNIQUE INDEX drivers_phone_unique (phone)
            SQL);
        }
    }

    public function down(): void
    {
        $index = DB::selectOne(<<<'SQL'
            SELECT COUNT(*) AS index_count
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'drivers'
              AND index_name = 'drivers_phone_unique'
        SQL);

        if ((int) ($index->index_count ?? 0) === 1) {
            DB::statement(<<<'SQL'
                ALTER TABLE drivers
                DROP INDEX drivers_phone_unique
            SQL);
        }
    }
};
