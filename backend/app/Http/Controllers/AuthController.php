<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | REGISTER
    |--------------------------------------------------------------------------
    |
    | Anyone can register.
    |
    | IMPORTANT:
    | Every person who registers through the website becomes a Renter.
    |
    | We NEVER accept "role" from the request.
    |
    */

    public function register(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | VALIDATE REGISTRATION DATA
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'phone' => [
                'required',
                'string',
                'max:20',
                'unique:users,phone',
            ],

            'address' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | CREATE RENTER
        |--------------------------------------------------------------------------
        |
        | The role is hard-coded as "renter".
        |
        | DO NOT change this to:
        |
        |     'role' => $request->role
        |
        | because that would allow someone to register as an Admin.
        |
        */

        $user = User::create([
            'name' => $validated['name'],

            'email' => $validated['email'],

            'phone' => $validated['phone'],

            'address' => $validated['address'] ?? null,

            'password' => $validated['password'],

            'role' => 'renter',
        ]);


        /*
        |--------------------------------------------------------------------------
        | LOG USER IN
        |--------------------------------------------------------------------------
        |
        | After successful registration, the user is immediately
        | authenticated using Laravel's session authentication.
        |
        */

        Auth::login($user);

        /*
        |--------------------------------------------------------------------------
        | SESSION SECURITY
        |--------------------------------------------------------------------------
        |
        | Regenerate the session ID after authentication.
        |
        */

        $request->session()->regenerate();


        return response()->json([
            'message' => 'Registration successful.',
            'user' => $user,
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    |
    | Both Admins and Renters use this same endpoint.
    |
    */

    public function login(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | VALIDATE LOGIN DATA
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'email' => [
                'required',
                'email',
            ],

            'password' => [
                'required',
                'string',
            ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | CHECK EMAIL + PASSWORD
        |--------------------------------------------------------------------------
        */

        if (!Auth::attempt([
            'email' => $validated['email'],
            'password' => $validated['password'],
        ])) {
            throw ValidationException::withMessages([
                'email' => [
                    'The provided credentials are incorrect.',
                ],
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | SESSION SECURITY
        |--------------------------------------------------------------------------
        */

        $request->session()->regenerate();


        /*
        |--------------------------------------------------------------------------
        | GET AUTHENTICATED USER
        |--------------------------------------------------------------------------
        */

        $user = Auth::user();


        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CURRENT USER
    |--------------------------------------------------------------------------
    |
    | React calls this when the application starts.
    |
    | This allows React to ask Laravel:
    |
    | "Is there currently a logged-in user?"
    |
    */

    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    |
    | Destroy the current authentication session.
    |
    */

    public function logout(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | LOG OUT
        |--------------------------------------------------------------------------
        */

        Auth::logout();


        /*
        |--------------------------------------------------------------------------
        | INVALIDATE SESSION
        |--------------------------------------------------------------------------
        |
        | This completely invalidates the old session.
        |
        */

        $request->session()->invalidate();


        /*
        |--------------------------------------------------------------------------
        | REGENERATE CSRF TOKEN
        |--------------------------------------------------------------------------
        */

        $request->session()->regenerateToken();


        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}