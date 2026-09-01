<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))

    /*
    |--------------------------------------------------------------------------
    | ROUTES
    |--------------------------------------------------------------------------
    */

    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    /*
    |--------------------------------------------------------------------------
    | MIDDLEWARE
    |--------------------------------------------------------------------------
    */

    ->withMiddleware(function (Middleware $middleware): void {

        /*
        |--------------------------------------------------------------------------
        | SANCTUM SPA AUTHENTICATION
        |--------------------------------------------------------------------------
        |
        | This tells Laravel to allow Sanctum's cookie-based
        | authentication for API requests coming from our SPA.
        |
        */

        $middleware->statefulApi();


        /*
        |--------------------------------------------------------------------------
        | ADMIN MIDDLEWARE
        |--------------------------------------------------------------------------
        |
        | This allows us to write:
        |
        |     Route::middleware('admin')
        |
        | in routes/api.php.
        |
        */

        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);


        /*
        |--------------------------------------------------------------------------
        | GUEST REDIRECTION
        |--------------------------------------------------------------------------
        |
        | API requests should receive JSON responses instead of
        | being redirected to a login webpage.
        |
        */

        $middleware->redirectGuestsTo(function (Request $request) {
            return $request->is('api/*') ? null : '/login';
        });
    })

    /*
    |--------------------------------------------------------------------------
    | EXCEPTIONS
    |--------------------------------------------------------------------------
    */

    ->withExceptions(function (Exceptions $exceptions): void {

        /*
        |--------------------------------------------------------------------------
        | RETURN JSON FOR API REQUESTS
        |--------------------------------------------------------------------------
        */

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) =>
                $request->is('api/*') ||
                $request->expectsJson(),
        );
    })

    ->create();