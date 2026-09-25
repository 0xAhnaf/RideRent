<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement(<<<'SQL'
            ALTER TABLE users
                ADD COLUMN phone VARCHAR(20) NULL AFTER email,
                ADD COLUMN address TEXT NULL AFTER phone,
                ADD COLUMN role VARCHAR(255) NOT NULL DEFAULT 'renter' AFTER address
        SQL);

        DB::update("UPDATE users SET phone = CONCAT('legacy-', id) WHERE phone IS NULL");

        DB::statement(<<<'SQL'
            ALTER TABLE users
                MODIFY COLUMN phone VARCHAR(20) NOT NULL,
                ADD UNIQUE KEY users_phone_unique (phone)
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement(<<<'SQL'
            ALTER TABLE users
                DROP INDEX users_phone_unique,
                DROP COLUMN role,
                DROP COLUMN address,
                DROP COLUMN phone
        SQL);
    }
};
