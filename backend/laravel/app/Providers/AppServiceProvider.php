<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind 'role' so the HTTP kernel can resolve it during termination
        $this->app->singleton('role', RoleMiddleware::class);
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
