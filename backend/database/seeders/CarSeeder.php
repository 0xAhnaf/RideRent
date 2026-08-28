<?php

namespace Database\Seeders;

use App\Models\Car;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

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
                'image_file' => 'toyota-axio.png',
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
                'image_file' => 'toyota-allion.jpg',
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
                'image_file' => 'toyota-premio.png',
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
                'image_file' => 'toyota-corolla.png',
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
                'image_file' => 'toyota-corolla-fielder.png',
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
                'image_file' => 'toyota-probox.jpg',
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
                'image_file' => 'toyota-noah-old.jpg',
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
                'image_file' => 'toyota-noah.jpg',
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
                'image_file' => 'toyota-hiace-10-seater.png',
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
                'image_file' => 'toyota-hiace-12-seat.png',
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
                'image_file' => 'toyota-hiace-15-seat-grand.png',
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
                'image_file' => 'toyota-coaster.png',
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
                'image_file' => 'toyota-harrier.png',
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
                'image_file' => 'honda-vezel.jpg',
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
                'image_file' => 'honda-insight.avif',
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
                'image_file' => 'toyota-prado.png',
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
                'image_file' => 'bmw-x5-m.png',
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
                'image_file' => 'mercedes-benz-e-class.jpg',
                'status' => 'available',
            ],
        ];

        foreach ($cars as $car) {
            $sourcePath = database_path(
                'seeders/assets/vehicles/'.$car['image_file']
            );
            $imagePath = 'vehicles/'.$car['image_file'];

            if (!is_file($sourcePath)) {
                throw new RuntimeException(
                    "Seeder image not found: {$sourcePath}"
                );
            }

            $imageContents = file_get_contents($sourcePath);

            if ($imageContents === false) {
                throw new RuntimeException(
                    "Seeder image could not be read: {$sourcePath}"
                );
            }

            if (!Storage::disk('public')->put($imagePath, $imageContents)) {
                throw new RuntimeException(
                    "Seeder image could not be stored: {$imagePath}"
                );
            }

            unset($car['image_file']);

            $car['image_path'] = $imagePath;
            $car['image_data'] = null;

            Car::updateOrCreate(
                ['name' => $car['name']],
                $car,
            );
        }
    }
}
