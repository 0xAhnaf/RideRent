<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Throwable;

class CarController extends Controller
{
    public function index()
    {
        $vehicles = DB::select(<<<'SQL'
            SELECT
                id,
                name,
                brand,
                category,
                seats,
                quantity,
                price,
                image_key,
                image_path,
                status,
                created_at,
                updated_at
            FROM cars
            ORDER BY id ASC
        SQL);

        return response()->json($this->formatVehicles($vehicles));
    }

    public function show($id)
    {
        $vehicle = $this->findVehicle($id);

        if (!$vehicle) {
            return response()->json([
                'message' => 'Vehicle not found.',
            ], 404);
        }

        return response()->json($this->formatVehicle($vehicle));
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'seats' => ['required', 'integer', 'min:1'],
            'quantity' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:available,unavailable'],
            'image' => [
                'required',
                'image',
                'mimes:png,jpg,jpeg,webp',
                'max:2048',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please check the vehicle information.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $imagePath = null;

        try {
            $imagePath = $request->file('image')->store('vehicles', 'public');

            if (!$imagePath) {
                throw new \RuntimeException('The vehicle image could not be stored.');
            }

            $vehicle = DB::transaction(function () use ($validated, $imagePath) {
                $timestamp = now();
                $inserted = DB::insert(
                    <<<'SQL'
                        INSERT INTO cars (
                            name,
                            brand,
                            category,
                            seats,
                            quantity,
                            price,
                            image_path,
                            status,
                            created_at,
                            updated_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    SQL,
                    [
                        trim($validated['name']),
                        trim($validated['brand']),
                        trim($validated['category']),
                        $validated['seats'],
                        $validated['quantity'],
                        $validated['price'],
                        $imagePath,
                        $validated['status'],
                        $timestamp,
                        $timestamp,
                    ],
                );

                if (!$inserted) {
                    throw new \RuntimeException('The vehicle record could not be created.');
                }

                $insertedVehicle = DB::selectOne(<<<'SQL'
                    SELECT
                        id,
                        name,
                        brand,
                        category,
                        seats,
                        quantity,
                        price,
                        image_key,
                        image_path,
                        status,
                        created_at,
                        updated_at
                    FROM cars
                    WHERE id = LAST_INSERT_ID()
                    LIMIT 1
                SQL);

                if (!$insertedVehicle) {
                    throw new \RuntimeException('The created vehicle could not be retrieved.');
                }

                return $insertedVehicle;
            });

            return response()->json([
                'message' => 'Vehicle and image added successfully.',
                'vehicle' => $this->formatVehicle($vehicle),
            ], 201);
        } catch (Throwable $error) {
            if ($imagePath) {
                Storage::disk('public')->delete($imagePath);
            }

            report($error);

            return response()->json([
                'message' => 'Unable to add the vehicle.',
                'error' => $error->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $vehicle = $this->findVehicle($id);

        if (!$vehicle) {
            return response()->json([
                'message' => 'Vehicle not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'seats' => ['required', 'integer', 'min:1'],
            'quantity' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:available,unavailable'],
            'image' => [
                'nullable',
                'image',
                'mimes:png,jpg,jpeg,webp',
                'max:2048',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please check the vehicle information.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $oldImagePath = $vehicle->image_path;
        $newImagePath = null;

        try {
            if ($request->hasFile('image')) {
                $newImagePath = $request->file('image')->store('vehicles', 'public');

                if (!$newImagePath) {
                    throw new \RuntimeException('The replacement image could not be stored.');
                }
            }

            $updatedVehicle = DB::transaction(function () use (
                $id,
                $validated,
                $newImagePath,
            ) {
                $timestamp = now();

                if ($newImagePath) {
                    DB::update(
                        <<<'SQL'
                            UPDATE cars
                            SET
                                name = ?,
                                brand = ?,
                                category = ?,
                                seats = ?,
                                quantity = ?,
                                price = ?,
                                image_path = ?,
                                status = ?,
                                updated_at = ?
                            WHERE id = ?
                        SQL,
                        [
                            trim($validated['name']),
                            trim($validated['brand']),
                            trim($validated['category']),
                            $validated['seats'],
                            $validated['quantity'],
                            $validated['price'],
                            $newImagePath,
                            $validated['status'],
                            $timestamp,
                            $id,
                        ],
                    );
                } else {
                    DB::update(
                        <<<'SQL'
                            UPDATE cars
                            SET
                                name = ?,
                                brand = ?,
                                category = ?,
                                seats = ?,
                                quantity = ?,
                                price = ?,
                                status = ?,
                                updated_at = ?
                            WHERE id = ?
                        SQL,
                        [
                            trim($validated['name']),
                            trim($validated['brand']),
                            trim($validated['category']),
                            $validated['seats'],
                            $validated['quantity'],
                            $validated['price'],
                            $validated['status'],
                            $timestamp,
                            $id,
                        ],
                    );
                }

                $updatedVehicle = $this->findVehicle($id);

                if (!$updatedVehicle) {
                    throw new \RuntimeException('The updated vehicle could not be retrieved.');
                }

                return $updatedVehicle;
            });

            if ($newImagePath && $oldImagePath && $oldImagePath !== $newImagePath) {
                Storage::disk('public')->delete($oldImagePath);
            }

            return response()->json([
                'message' => 'Vehicle updated successfully.',
                'vehicle' => $this->formatVehicle($updatedVehicle),
            ]);
        } catch (Throwable $error) {
            if ($newImagePath) {
                Storage::disk('public')->delete($newImagePath);
            }

            report($error);

            return response()->json([
                'message' => 'Unable to update the vehicle.',
                'error' => $error->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $vehicle = $this->findVehicle($id);

        if (!$vehicle) {
            return response()->json([
                'message' => 'Vehicle not found.',
            ], 404);
        }

        $imagePath = $vehicle->image_path;

        try {
            DB::transaction(function () use ($id) {
                $deletedRows = DB::delete(
                    'DELETE FROM cars WHERE id = ?',
                    [$id],
                );

                if ($deletedRows !== 1) {
                    throw new \RuntimeException('The vehicle record could not be deleted.');
                }
            });
        } catch (Throwable $error) {
            report($error);

            return response()->json([
                'message' => 'Unable to delete the vehicle.',
                'error' => $error->getMessage(),
            ], 500);
        }

        if ($imagePath) {
            try {
                Storage::disk('public')->delete($imagePath);
            } catch (Throwable $error) {
                report($error);
            }
        }

        return response()->json([
            'message' => 'Vehicle deleted successfully.',
        ]);
    }

    private function findVehicle($id): ?object
    {
        return DB::selectOne(
            <<<'SQL'
                SELECT
                    id,
                    name,
                    brand,
                    category,
                    seats,
                    quantity,
                    price,
                    image_key,
                    image_path,
                    status,
                    created_at,
                    updated_at
                FROM cars
                WHERE id = ?
                LIMIT 1
            SQL,
            [$id],
        );
    }

    private function formatVehicles(array $vehicles): array
    {
        return array_map(
            fn (object $vehicle): array => $this->formatVehicle($vehicle),
            $vehicles,
        );
    }

    private function formatVehicle(object $vehicle): array
    {
        return [
            'id' => $vehicle->id,
            'name' => $vehicle->name,
            'brand' => $vehicle->brand,
            'category' => $vehicle->category,
            'seats' => $vehicle->seats,
            'quantity' => $vehicle->quantity,
            'price' => $vehicle->price,
            'image_key' => $vehicle->image_key,
            'image_path' => $vehicle->image_path,
            'status' => $vehicle->status,
            'created_at' => $vehicle->created_at,
            'updated_at' => $vehicle->updated_at,
            'image_url' => $vehicle->image_path
                ? Storage::disk('public')->url($vehicle->image_path)
                : null,
        ];
    }
}
