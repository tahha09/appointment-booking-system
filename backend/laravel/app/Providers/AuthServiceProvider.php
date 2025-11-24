<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\Sanctum;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

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

        // Optional: Define specific permissions
        Gate::define('manage-users', function ($user) {
            return $user->role === 'admin';
        });

        Gate::define('manage-appointments', function ($user) {
            return in_array($user->role, ['admin', 'doctor', 'patient']);
        });

        Gate::define('manage-schedule', function ($user) {
            return $user->role === 'doctor';
        });
    }
}
