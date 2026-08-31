<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DriverController extends Controller
{
    public function index()
    {
        $drivers = DB::select(<<<'SQL'
            SELECT
                id,
                name,
                phone,
                license_number,
                experience_years,
                status,
                created_at,
                updated_at
            FROM drivers
            ORDER BY name ASC, id ASC
        SQL);

        return response()->json([
            'drivers' => $this->formatDrivers($drivers),
            'count' => count($drivers),
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
        $phone = trim($validated['phone']);
        $licenseNumber = strtoupper(trim($validated['license_number']));
        $uniquenessErrors = $this->uniquenessErrors($phone, $licenseNumber);

        if ($uniquenessErrors !== []) {
            return $this->uniquenessErrorResponse($uniquenessErrors);
        }

        try {
            $driver = DB::transaction(function () use (
                $validated,
                $phone,
                $licenseNumber,
            ) {
                $timestamp = now();
                $inserted = DB::insert(
                    <<<'SQL'
                        INSERT INTO drivers (
                            name,
                            phone,
                            license_number,
                            experience_years,
                            status,
                            created_at,
                            updated_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    SQL,
                    [
                        trim($validated['name']),
                        $phone,
                        $licenseNumber,
                        $validated['experience_years'],
                        $validated['status'],
                        $timestamp,
                        $timestamp,
                    ],
                );

                if (!$inserted) {
                    throw new \RuntimeException('The driver record could not be created.');
                }

                $insertedDriver = DB::selectOne(<<<'SQL'
                    SELECT
                        id,
                        name,
                        phone,
                        license_number,
                        experience_years,
                        status,
                        created_at,
                        updated_at
                    FROM drivers
                    WHERE id = LAST_INSERT_ID()
                    LIMIT 1
                SQL);

                if (!$insertedDriver) {
                    throw new \RuntimeException('The created driver could not be retrieved.');
                }

                return $insertedDriver;
            });
        } catch (QueryException $error) {
            if ($this->isDuplicateKeyError($error)) {
                $uniquenessErrors = $this->uniquenessErrors(
                    $phone,
                    $licenseNumber,
                );

                return $this->uniquenessErrorResponse(
                    $uniquenessErrors !== []
                        ? $uniquenessErrors
                        : ['phone' => ['The phone number or license number is already in use.']],
                );
            }

            throw $error;
        }

        return response()->json([
            'message' => 'Driver added successfully.',
            'driver' => $this->formatDriver($driver),
        ], 201);
    }

    public function show($id)
    {
        $driver = $this->findDriver($id);

        if (!$driver) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'driver' => $this->formatDriver($driver),
        ]);
    }

    public function update(Request $request, $id)
    {
        if (!$this->findDriver($id)) {
            return $this->notFoundResponse();
        }

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
        $phone = trim($validated['phone']);
        $licenseNumber = strtoupper(trim($validated['license_number']));
        $uniquenessErrors = $this->uniquenessErrors(
            $phone,
            $licenseNumber,
            $id,
        );

        if ($uniquenessErrors !== []) {
            return $this->uniquenessErrorResponse($uniquenessErrors);
        }

        try {
            $updatedDriver = DB::transaction(function () use (
                $id,
                $validated,
                $phone,
                $licenseNumber,
            ) {
                DB::update(
                    <<<'SQL'
                        UPDATE drivers
                        SET
                            name = ?,
                            phone = ?,
                            license_number = ?,
                            experience_years = ?,
                            status = ?,
                            updated_at = ?
                        WHERE id = ?
                    SQL,
                    [
                        trim($validated['name']),
                        $phone,
                        $licenseNumber,
                        $validated['experience_years'],
                        $validated['status'],
                        now(),
                        $id,
                    ],
                );

                $updatedDriver = $this->findDriver($id);

                if (!$updatedDriver) {
                    throw new \RuntimeException('The updated driver could not be retrieved.');
                }

                return $updatedDriver;
            });
        } catch (QueryException $error) {
            if ($this->isDuplicateKeyError($error)) {
                $uniquenessErrors = $this->uniquenessErrors(
                    $phone,
                    $licenseNumber,
                    $id,
                );

                return $this->uniquenessErrorResponse(
                    $uniquenessErrors !== []
                        ? $uniquenessErrors
                        : ['phone' => ['The phone number or license number is already in use.']],
                );
            }

            throw $error;
        }

        return response()->json([
            'message' => 'Driver updated successfully.',
            'driver' => $this->formatDriver($updatedDriver),
        ]);
    }

    public function destroy($id)
    {
        if (!$this->findDriver($id)) {
            return $this->notFoundResponse();
        }

        try {
            $deletedRows = DB::delete(
                'DELETE FROM drivers WHERE id = ?',
                [$id],
            );

            if ($deletedRows !== 1) {
                return $this->notFoundResponse();
            }
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

    private function rules(): array
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

    private function findDriver($id): ?object
    {
        return DB::selectOne(
            <<<'SQL'
                SELECT
                    id,
                    name,
                    phone,
                    license_number,
                    experience_years,
                    status,
                    created_at,
                    updated_at
                FROM drivers
                WHERE id = ?
                LIMIT 1
            SQL,
            [$id],
        );
    }

    private function uniquenessErrors(
        string $phone,
        string $licenseNumber,
        $ignoredDriverId = null,
    ): array {
        if ($ignoredDriverId === null) {
            $duplicates = DB::selectOne(
                <<<'SQL'
                    SELECT
                        EXISTS(
                            SELECT 1
                            FROM drivers
                            WHERE phone = ?
                        ) AS phone_exists,
                        EXISTS(
                            SELECT 1
                            FROM drivers
                            WHERE license_number = ?
                        ) AS license_exists
                SQL,
                [$phone, $licenseNumber],
            );
        } else {
            $duplicates = DB::selectOne(
                <<<'SQL'
                    SELECT
                        EXISTS(
                            SELECT 1
                            FROM drivers
                            WHERE phone = ?
                              AND id <> ?
                        ) AS phone_exists,
                        EXISTS(
                            SELECT 1
                            FROM drivers
                            WHERE license_number = ?
                              AND id <> ?
                        ) AS license_exists
                SQL,
                [
                    $phone,
                    $ignoredDriverId,
                    $licenseNumber,
                    $ignoredDriverId,
                ],
            );
        }

        $errors = [];

        if ((int) ($duplicates->phone_exists ?? 0) === 1) {
            $errors['phone'] = ['The phone number has already been taken.'];
        }

        if ((int) ($duplicates->license_exists ?? 0) === 1) {
            $errors['license_number'] = [
                'The license number has already been taken.',
            ];
        }

        return $errors;
    }

    private function uniquenessErrorResponse(array $errors)
    {
        return response()->json([
            'message' => 'Please check the driver information.',
            'errors' => $errors,
        ], 422);
    }

    private function notFoundResponse()
    {
        return response()->json([
            'message' => 'Driver not found.',
        ], 404);
    }

    private function isDuplicateKeyError(QueryException $error): bool
    {
        return (int) ($error->errorInfo[1] ?? 0) === 1062;
    }

    private function formatDrivers(array $drivers): array
    {
        return array_map(
            fn (object $driver): array => $this->formatDriver($driver),
            $drivers,
        );
    }

    private function formatDriver(object $driver): array
    {
        return [
            'id' => (int) $driver->id,
            'name' => $driver->name,
            'phone' => $driver->phone,
            'license_number' => $driver->license_number,
            'experience_years' => (int) $driver->experience_years,
            'status' => $driver->status,
            'created_at' => $driver->created_at,
            'updated_at' => $driver->updated_at,
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
