<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LIST USERS
    |--------------------------------------------------------------------------
    |
    | Returns ONLY Renter accounts for the Admin "Manage Users"
    | dashboard page. Admin accounts are never returned.
    |
    */

    public function index()
    {
        $users = User::where('role', 'renter')
            ->orderBy('name')->orderBy('id')->get();

        return response()->json([
            'users' => $users,
            'count' => $users->count(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE USER
    |--------------------------------------------------------------------------
    |
    | Admin can create Renter accounts from the dashboard.
    | The role is always "renter" and is never read from the request.
    |
    */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'email' => ['required', 'email', 'max:255', 'unique:users,email'],

            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],

            'address' => ['nullable', 'string', 'max:1000'],

            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name' => trim($validated['name']),
            'email' => $validated['email'],
            'phone' => trim($validated['phone']),
            'address' => $validated['address'] ?? null,
            'password' => $validated['password'],
            'role' => 'renter',
        ]);

        return response()->json([
            'message' => 'User created successfully.',
            'user' => $user,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW SINGLE USER
    |--------------------------------------------------------------------------
    */

    public function show($id)
    {
        $user = User::where('role', 'renter')->find($id);

        if (!$user) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'user' => $user,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE USER
    |--------------------------------------------------------------------------
    |
    | Password is optional on update. It is only changed when the
    | Admin provides a new value.
    |
    */

    public function update(Request $request, $id)
    {
        $user = User::where('role', 'renter')->find($id);

        if (!$user) {
            return $this->notFoundResponse();
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],

            'phone' => [
                'required',
                'string',
                'max:20',
                Rule::unique('users', 'phone')->ignore($user->id),
            ],

            'address' => ['nullable', 'string', 'max:1000'],

            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $updateData = [
            'name' => trim($validated['name']),
            'email' => $validated['email'],
            'phone' => trim($validated['phone']),
            'address' => $validated['address'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = $validated['password'];
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $user->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE USER
    |--------------------------------------------------------------------------
    |
    | Only Renter accounts can be deleted here.
    |
    */

    public function destroy($id)
    {
        $deleted = DB::transaction(function () use ($id) {
            // 1. Lock the renter row first. Booking creation takes a shared lock
            //    on this same row, so no new booking can slip in while we check.
            $user = DB::selectOne(
                "SELECT id FROM users WHERE id = ? AND role = 'renter' LIMIT 1 FOR UPDATE",
                [$id],
            );

            if (!$user) {
                return false;
            }

            // 2. Refuse to delete while the user still has live work.
            $activeCarBooking = DB::selectOne(
                "SELECT b_id FROM bookings
                 WHERE u_id = ? AND booking_status IN ('Pending', 'Confirmed')
                 LIMIT 1",
                [$user->id],
            );

            $activeAmbulanceBooking = DB::selectOne(
                "SELECT id FROM ambulance_bookings
                 WHERE user_id = ? AND status IN ('pending', 'confirmed')
                 LIMIT 1",
                [$user->id],
            );

            if ($activeCarBooking || $activeAmbulanceBooking) {
                throw ValidationException::withMessages([
                    'user' => 'This user has an active booking. Complete or cancel it before deleting the user.',
                ]);
            }

            // 3. Ambulance payments are RESTRICTed by the database; give a clear
            //    message instead of a raw foreign-key error.
            $ambulancePayment = DB::selectOne(
                'SELECT p.id
                 FROM ambulance_payments p
                 JOIN ambulance_bookings b ON b.id = p.ambulance_booking_id
                 WHERE b.user_id = ?
                 LIMIT 1',
                [$user->id],
            );

            if ($ambulancePayment) {
                throw ValidationException::withMessages([
                    'user' => 'This user has ambulance payment records and cannot be deleted.',
                ]);
            }

            // 4. Delete. Tokens are polymorphic (no foreign key), so remove them explicitly.
            DB::delete(
                'DELETE FROM personal_access_tokens WHERE tokenable_type = ? AND tokenable_id = ?',
                [User::class, $user->id],
            );

            $rows = DB::delete(
                "DELETE FROM users WHERE id = ? AND role = 'renter'",
                [$user->id],
            );

            if ($rows !== 1) {
                throw new \RuntimeException('The user record could not be deleted.');
            }

            return true;
        }, 3);

        if (!$deleted) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'User deleted successfully.',
        ]);
    }

    private function notFoundResponse()
    {
        return response()->json([
            'message' => 'User not found.',
        ], 404);
    }
}