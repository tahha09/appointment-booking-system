<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Carbon\Carbon;
use App\Models\AllNotification;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, CanResetPassword;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'date_of_birth',
        'address',
        'profile_image',
        'status'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $with = [];
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'date_of_birth' => 'date',
    ];

    // Relationships
    public function doctor()
    {
        return $this->hasOne(Doctor::class);
    }

    public function patient()
    {
        return $this->hasOne(Patient::class);
    }

    public function admin()
    {
        return $this->hasOne(Admin::class);
    }

    public function notifications()
    {
        return $this->morphMany(AllNotification::class, 'notifiable');
    }

    // Scopes
    public function scopeDoctors($query)
    {
        return $query->where('role', 'doctor');
    }

    public function scopePatients($query)
    {
        return $query->where('role', 'patient');
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    // Accessors & Mutators
    public function getProfileImageUrlAttribute()
    {
        if (!$this->profile_image) {
            return asset('assets/default-avatar.png');
        }

        if (Str::startsWith($this->profile_image, ['http://', 'https://'])) {
            return $this->profile_image;
        }

        $path = ltrim($this->profile_image, '/');

        return asset('storage/' . $path);
    }

    public function getAgeAttribute()
    {
        return $this->date_of_birth
            ? Carbon::parse($this->date_of_birth)->age
            : null;
    }

    // Methods
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isDoctor()
    {
        return $this->role === 'doctor';
    }

    public function isPatient()
    {
        return $this->role === 'patient';
    }
}
