<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | USERS TABLE
        |--------------------------------------------------------------------------
        |
        | This table stores both Admin and Renter accounts.
        |
        | role:
        |   admin  → administrator
        |   renter → normal website user
        |
        | IMPORTANT:
        | Users registering through the website will ALWAYS
        | receive the "renter" role.
        |
        | Admin accounts are created by the database seeder.
        |
        */

        Schema::create('users', function (Blueprint $table) {

            $table->id();

            $table->string('name');

            /*
            |--------------------------------------------------------------------------
            | EMAIL
            |--------------------------------------------------------------------------
            |
            | Each account must have a different email address.
            |
            */

            $table->string('email')->unique();

            /*
            |--------------------------------------------------------------------------
            | PHONE
            |--------------------------------------------------------------------------
            |
            | Each account must have a different phone number.
            |
            | If someone tries to register with an existing phone number,
            | Laravel validation will tell them that the phone number
            | has already been taken.
            |
            */

            $table->string('phone', 20)->unique();

            /*
            |--------------------------------------------------------------------------
            | ADDRESS
            |--------------------------------------------------------------------------
            |
            | Address does NOT need to be unique.
            |
            | Nullable means the user can register without providing
            | an address if we decide to make it optional.
            |
            */

            $table->text('address')->nullable();

            /*
            |--------------------------------------------------------------------------
            | ROLE
            |--------------------------------------------------------------------------
            |
            | Normal registration always creates:
            |
            |     role = renter
            |
            | The Admin is created separately through DatabaseSeeder.
            |
            */

            $table->string('role')->default('renter');

            $table->timestamp('email_verified_at')->nullable();

            $table->string('password');

            $table->rememberToken();

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | PASSWORD RESET TOKENS
        |--------------------------------------------------------------------------
        */

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });


        /*
        |--------------------------------------------------------------------------
        | SESSIONS
        |--------------------------------------------------------------------------
        |
        | Laravel stores authenticated browser sessions here.
        |
        | This is part of our cookie/session-based authentication.
        |
        */

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();

            $table->foreignId('user_id')
                ->nullable()
                ->index();

            $table->string('ip_address', 45)->nullable();

            $table->text('user_agent')->nullable();

            $table->longText('payload');

            $table->integer('last_activity')->index();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');

        Schema::dropIfExists('password_reset_tokens');

        Schema::dropIfExists('sessions');
    }
};