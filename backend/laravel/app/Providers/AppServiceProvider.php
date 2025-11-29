<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
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
        // Limit default string length for older MySQL versions (prevents "Specified key was too long")
        Schema::defaultStringLength(191);

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
