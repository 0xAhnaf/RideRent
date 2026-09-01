<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Allow only Admin users to access the route.
     */
    public function handle(
        Request $request,
        Closure $next
    ): Response {

        /*
        |--------------------------------------------------------------------------
        | CHECK AUTHENTICATION
        |--------------------------------------------------------------------------
        |
        | If there is no logged-in user, return 401.
        |
        */

        if (!$request->user()) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }


        /*
        |--------------------------------------------------------------------------
        | CHECK ADMIN ROLE
        |--------------------------------------------------------------------------
        |
        | Only users whose database role is "admin"
        | are allowed to continue.
        |
        */

        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Access denied. Admin privileges required.',
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | ADMIN → ALLOW REQUEST
        |--------------------------------------------------------------------------
        */

        return $next($request);
    }
}