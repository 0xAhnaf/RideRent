<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ADMIN ACCOUNT
        |--------------------------------------------------------------------------
        |
        | Admin accounts are NOT created through the registration page.
        |
        | To change the Admin account, change the information below
        | and run:
        |
        |     php artisan db:seed
        |
        | The role is explicitly set to "admin" here.
        |
        */

        User::updateOrCreate(
            [
                'email' => 'admin@riderent.com',
            ],
            [
                'name' => 'RideRent Admin',

                'phone' => '01700000000',

                'address' => 'RideRent Office',

                'password' => Hash::make('Admin@12345'),

                'role' => 'admin',
            ]
        );


        /*
        |--------------------------------------------------------------------------
        | OTHER SEEDERS
        |--------------------------------------------------------------------------
        |
        | Add other project seeders here.
        |
        | Example:
        |
        | $this->call([
        |     CarSeeder::class,
        |     DriverSeeder::class,
        | ]);
        |
        */

        $this->call([
            CarSeeder::class,
        ]);
    }
}