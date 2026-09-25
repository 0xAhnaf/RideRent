<?php

namespace App\Http\Controllers;

use App\Services\AmbulanceRecords;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AmbulanceDriverController extends Controller
{
    public function index()
    {
        $drivers = DB::select('SELECT * FROM ambulance_drivers ORDER BY name ASC, id ASC');

        return response()->json(['drivers' => $drivers, 'count' => count($drivers)]);
    }

    public function show(int $id)
    {
        return response()->json(['driver' => $this->findDriver($id)]);
    }

    public function store(Request $request)
    {
        return $this->save($request);
    }

    public function update(Request $request, int $id)
    {
        $this->findDriver($id);

        return $this->save($request, $id);
    }

    private function save(Request $request, ?int $id = null)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20', 'regex:/^[0-9+()\-\s]+$/'],
            'license_number' => ['required', 'string', 'max:100'],
            'experience_years' => ['required', 'integer', 'min:0', 'max:60'],
            'status' => ['required', 'in:available,busy,inactive'],
        ]);

        $data['phone'] = trim($data['phone']);
        $data['license_number'] = strtoupper(trim($data['license_number']));
        $this->checkDuplicates($data, $id);

        try {
            $driver = DB::transaction(function () use ($data, $id) {
                if ($id !== null) {
                    $records = new AmbulanceRecords;
                    $records->lockDriver($id);

                    if ($data['status'] !== 'busy' && $records->driverHasActiveBooking($id)) {
                        throw ValidationException::withMessages(['status' => 'This driver has an active ambulance booking and must remain busy.']);
                    }
                }

                $values = [trim($data['name']), $data['phone'], $data['license_number'], $data['experience_years'], $data['status']];

                if ($id === null) {
                    DB::insert(<<<'SQL'
                        INSERT INTO ambulance_drivers (name, phone, license_number, experience_years, status, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    SQL, $values);
                    $id = (int) DB::selectOne('SELECT LAST_INSERT_ID() AS id')->id;
                } else {
                    DB::update(<<<'SQL'
                        UPDATE ambulance_drivers SET name = ?, phone = ?, license_number = ?, experience_years = ?,
                            status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
                    SQL, [...$values, $id]);
                }

                return $this->findDriver($id);
            }, 3);
        } catch (QueryException $error) {
            if ((int) ($error->errorInfo[1] ?? 0) !== 1062) {
                throw $error;
            }

            $this->checkDuplicates($data, $id);
            throw ValidationException::withMessages(['phone' => 'The phone number or license number is already in use.']);
        }

        return response()->json([
            'message' => $id === null ? 'Driver added successfully.' : 'Driver updated successfully.',
            'driver' => $driver,
        ], $id === null ? 201 : 200);
    }

    public function destroy(int $id)
    {
        DB::transaction(function () use ($id) {
            (new AmbulanceRecords)->lockDriver($id);

            if (DB::selectOne('SELECT id FROM ambulance_bookings WHERE ambulance_driver_id = ? LIMIT 1', [$id])) {
                abort(409, 'This driver cannot be deleted because the record is in use.');
            }

            DB::delete('DELETE FROM ambulance_drivers WHERE id = ?', [$id]);
        }, 3);

        return response()->json(['message' => 'Driver deleted successfully.']);
    }

    private function findDriver(int $id): object
    {
        return DB::selectOne('SELECT * FROM ambulance_drivers WHERE id = ?', [$id])
            ?? abort(404, 'Ambulance driver not found.');
    }

    private function checkDuplicates(array $data, ?int $id): void
    {
        $duplicates = DB::select(<<<'SQL'
            SELECT phone, license_number FROM ambulance_drivers
            WHERE (phone = ? OR license_number = ?) AND id <> ?
        SQL, [$data['phone'], $data['license_number'], $id ?? 0]);

        $errors = [];
        foreach ($duplicates as $driver) {
            if ($driver->phone === $data['phone']) {
                $errors['phone'] = 'The phone number has already been taken.';
            }
            if (strcasecmp($driver->license_number, $data['license_number']) === 0) {
                $errors['license_number'] = 'The license number has already been taken.';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }
}
