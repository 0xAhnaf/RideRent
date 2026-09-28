<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
        $user = User::where('role', 'renter')->find($id);

        if (!$user) {
            return $this->notFoundResponse();
        }


        $user->delete();

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