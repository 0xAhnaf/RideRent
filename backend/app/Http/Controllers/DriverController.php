<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DriverController extends Controller
{
    public function index()
    {
        $drivers = Driver::query()
            ->orderBy('name')
            ->get();

        return response()->json([
            'drivers' => $drivers,
            'count' => $drivers->count(),
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make(
            $this->normalizedInput($request),
            $this->rules(),
        );

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please check the driver information.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $driver = Driver::create([
            'name' => trim($validated['name']),
            'phone' => trim($validated['phone']),
            'license_number' => strtoupper(trim($validated['license_number'])),
            'experience_years' => $validated['experience_years'],
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'Driver added successfully.',
            'driver' => $driver,
        ], 201);
    }

    public function show(Driver $driver)
    {
        return response()->json([
            'driver' => $driver,
        ]);
    }

    public function update(Request $request, Driver $driver)
    {
        $validator = Validator::make(
            $this->normalizedInput($request),
            $this->rules($driver),
        );

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please check the driver information.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $driver->update([
            'name' => trim($validated['name']),
            'phone' => trim($validated['phone']),
            'license_number' => strtoupper(trim($validated['license_number'])),
            'experience_years' => $validated['experience_years'],
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'Driver updated successfully.',
            'driver' => $driver->fresh(),
        ]);
    }

    public function destroy(Driver $driver)
    {
        try {
            $driver->delete();
        } catch (QueryException $error) {
            report($error);

            return response()->json([
                'message' => 'This driver cannot be deleted because the record is in use.',
            ], 409);
        }

        return response()->json([
            'message' => 'Driver deleted successfully.',
        ]);
    }

    private function rules(?Driver $driver = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => [
                'required',
                'string',
                'max:20',
                'regex:/^[0-9+()\-\s]+$/',
            ],
            'license_number' => [
                'required',
                'string',
                'max:100',
                Rule::unique('drivers', 'license_number')->ignore($driver?->id),
            ],
            'experience_years' => [
                'required',
                'integer',
                'min:0',
                'max:60',
            ],
            'status' => ['required', 'in:available,busy,inactive'],
        ];
    }

    private function normalizedInput(Request $request): array
    {
        return array_merge($request->all(), [
            'name' => trim((string) $request->input('name')),
            'phone' => trim((string) $request->input('phone')),
            'license_number' => strtoupper(
                trim((string) $request->input('license_number')),
            ),
        ]);
    }
}
