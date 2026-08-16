<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Car;

class CarSeeder extends Seeder
{
    public function run(): void
    {
        $cars = [

            [
                'name' => 'Toyota Axio',
                'brand' => 'Toyota',
                'category' => 'Sedan',
                'seats' => 5,
                'quantity' => 5,
                'price' => 3000,
                'image_key' => 'Toyota Axio',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Allion',
                'brand' => 'Toyota',
                'category' => 'Sedan',
                'seats' => 5,
                'quantity' => 4,
                'price' => 3200,
                'image_key' => 'Toyota Allion',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Premio',
                'brand' => 'Toyota',
                'category' => 'Sedan',
                'seats' => 5,
                'quantity' => 4,
                'price' => 3500,
                'image_key' => 'Toyota Premio',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Corolla',
                'brand' => 'Toyota',
                'category' => 'Sedan',
                'seats' => 5,
                'quantity' => 6,
                'price' => 2500,
                'image_key' => 'Toyota Corolla',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Fielder',
                'brand' => 'Toyota',
                'category' => 'Hatchback',
                'seats' => 5,
                'quantity' => 3,
                'price' => 3200,
                'image_key' => 'Toyota Corolla Fielder',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Probox',
                'brand' => 'Toyota',
                'category' => 'Hatchback',
                'seats' => 5,
                'quantity' => 6,
                'price' => 2600,
                'image_key' => 'Toyota Probox',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Noah Old',
                'brand' => 'Toyota',
                'category' => 'MPV',
                'seats' => 7,
                'quantity' => 9,
                'price' => 4000,
                'image_key' => 'Toyota Noah Old',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Noah New Model',
                'brand' => 'Toyota',
                'category' => 'MPV',
                'seats' => 7,
                'quantity' => 4,
                'price' => 6000,
                'image_key' => 'Toyota Noah',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Hiace (10 Seat)',
                'brand' => 'Toyota',
                'category' => 'Microbus',
                'seats' => 10,
                'quantity' => 8,
                'price' => 5500,
                'image_key' => 'Toyota Hiace 10 Seater',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Hiace (12 Seat)',
                'brand' => 'Toyota',
                'category' => 'Microbus',
                'seats' => 12,
                'quantity' => 19,
                'price' => 6000,
                'image_key' => 'Toyota Hiace 12 Seat',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Hiace (15 Seat)',
                'brand' => 'Toyota',
                'category' => 'Microbus',
                'seats' => 15,
                'quantity' => 6,
                'price' => 7000,
                'image_key' => 'Toyota Hiace 15 Seat Grand',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Coaster',
                'brand' => 'Toyota',
                'category' => 'Bus',
                'seats' => 25,
                'quantity' => 2,
                'price' => 21000,
                'image_key' => 'Toyota Coaster',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Harrier',
                'brand' => 'Toyota',
                'category' => 'Premium SUV',
                'seats' => 5,
                'quantity' => 1,
                'price' => 12000,
                'image_key' => 'Toyota Harrier',
                'status' => 'available',
            ],

            [
                'name' => 'Honda Vezel',
                'brand' => 'Honda',
                'category' => 'SUV',
                'seats' => 5,
                'quantity' => 2,
                'price' => 5000,
                'image_key' => 'Honda Vezel',
                'status' => 'available',
            ],

            [
                'name' => 'Honda Insight',
                'brand' => 'Honda',
                'category' => 'Premium Sedan',
                'seats' => 5,
                'quantity' => 1,
                'price' => 4000,
                'image_key' => 'Honda Insight',
                'status' => 'available',
            ],

            [
                'name' => 'Toyota Prado',
                'brand' => 'Toyota',
                'category' => 'Premium SUV',
                'seats' => 7,
                'quantity' => 1,
                'price' => 18000,
                'image_key' => 'Toyota Prado',
                'status' => 'available',
            ],

            [
                'name' => 'BMW X5',
                'brand' => 'BMW',
                'category' => 'Luxury Sedan',
                'seats' => 5,
                'quantity' => 1,
                'price' => 40000,
                'image_key' => 'BMW X5 M',
                'status' => 'available',
            ],

            [
                'name' => 'Mercedes Benz E-Class',
                'brand' => 'Mercedes Benz',
                'category' => 'Luxury Sedan',
                'seats' => 5,
                'quantity' => 1,
                'price' => 35000,
                'image_key' => 'Mercedes Benz E-Class',
                'status' => 'available',
            ],

        ];

        foreach ($cars as $car) {
            Car::create($car);
        }
    }
}