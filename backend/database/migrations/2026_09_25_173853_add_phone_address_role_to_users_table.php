<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [
            'phone' => 'VARCHAR(20) NULL AFTER email',
            'address' => 'TEXT NULL AFTER phone',
            'role' => "VARCHAR(255) NOT NULL DEFAULT 'renter' AFTER address",
        ];

        foreach ($columns as $column => $definition) {
            $exists = DB::selectOne(
                'SELECT COUNT(*) AS total
                 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = ?
                   AND COLUMN_NAME = ?',
                ['users', $column]
            );

            if ((int) $exists->total === 0) {
                DB::statement(
                    "ALTER TABLE users ADD COLUMN `$column` $definition"
                );
            }
        }

        // Check the final phone values before updating or adding uniqueness.
        $duplicate = DB::selectOne(
            "SELECT COALESCE(phone, CONCAT('legacy-', id)) AS final_phone
             FROM users
             GROUP BY COALESCE(phone, CONCAT('legacy-', id))
             HAVING COUNT(*) > 1
             LIMIT 1"
        );

        if ($duplicate) {
            throw new \RuntimeException(
                'Duplicate phone values found. Resolve them before rerunning this migration.'
            );
        }

        $tooLong = DB::selectOne(
            "SELECT id
             FROM users
             WHERE CHAR_LENGTH(
                 COALESCE(phone, CONCAT('legacy-', id))
             ) > 20
             LIMIT 1"
        );

        if ($tooLong) {
            throw new \RuntimeException(
                'A phone value exceeds 20 characters. Resolve it before rerunning this migration.'
            );
        }

        DB::update(
            "UPDATE users
             SET phone = CONCAT('legacy-', id)
             WHERE phone IS NULL"
        );

        DB::statement(
            'ALTER TABLE users
             MODIFY COLUMN phone VARCHAR(20) NOT NULL'
        );

        // Detect any existing single-column UNIQUE index on phone.
        $uniquePhoneIndex = DB::selectOne(
            "SELECT INDEX_NAME
             FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'users'
             GROUP BY INDEX_NAME
             HAVING MAX(NON_UNIQUE) = 0
                AND COUNT(*) = 1
                AND MAX(COLUMN_NAME) = 'phone'
                AND MAX(COALESCE(SUB_PART, 0)) = 0
             LIMIT 1"
        );

        if (!$uniquePhoneIndex) {
            $nameTaken = DB::selectOne(
                "SELECT INDEX_NAME
                 FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'users'
                   AND INDEX_NAME = 'users_phone_unique'
                 LIMIT 1"
            );

            if ($nameTaken) {
                throw new \RuntimeException(
                    'users_phone_unique exists with a different definition. Inspect the index before continuing.'
                );
            }

            DB::statement(
                'ALTER TABLE users
                 ADD UNIQUE KEY users_phone_unique (phone)'
            );
        }
    }

    public function down(): void
    {
        // Intentionally preserve columns and data:
        // some may have existed before this migration.
    }
};