<?php

namespace App\Http\Controllers;

use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Throwable;

class CarController extends Controller
{
    public function index()
    {
        return response()->json(Car::all());
    }

    public function show($id)
    {
        $vehicle = Car::find($id);

        if (!$vehicle) {
            return response()->json([
                'message' => 'Vehicle not found.',
            ], 404);
        }

        return response()->json($vehicle);
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
                return Car::create([
                    'name' => trim($validated['name']),
                    'brand' => trim($validated['brand']),
                    'category' => trim($validated['category']),
                    'seats' => $validated['seats'],
                    'quantity' => $validated['quantity'],
                    'price' => $validated['price'],
                    'image_path' => $imagePath,
                    'status' => $validated['status'],
                ]);
            });

            return response()->json([
                'message' => 'Vehicle and image added successfully.',
                'vehicle' => $vehicle->fresh(),
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
        $vehicle = Car::find($id);

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

            $updateData = [
                'name' => trim($validated['name']),
                'brand' => trim($validated['brand']),
                'category' => trim($validated['category']),
                'seats' => $validated['seats'],
                'quantity' => $validated['quantity'],
                'price' => $validated['price'],
                'status' => $validated['status'],
            ];

            if ($newImagePath) {
                $updateData['image_path'] = $newImagePath;

                // Remove an old Base64 value when this record receives a file-based image.
                $updateData['image_data'] = null;
            }

            DB::transaction(function () use ($vehicle, $updateData) {
                $vehicle->update($updateData);
            });

            if ($newImagePath && $oldImagePath && $oldImagePath !== $newImagePath) {
                Storage::disk('public')->delete($oldImagePath);
            }

            return response()->json([
                'message' => 'Vehicle updated successfully.',
                'vehicle' => $vehicle->fresh(),
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
}
