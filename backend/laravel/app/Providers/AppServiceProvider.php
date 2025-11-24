<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Define gates for role-based authorization
        Gate::define('admin', function ($user) {
            return $user->role === 'admin';
        });

        Gate::define('doctor', function ($user) {
            return $user->role === 'doctor';
        });

        Gate::define('patient', function ($user) {
            return $user->role === 'patient';
        });
    }
}
