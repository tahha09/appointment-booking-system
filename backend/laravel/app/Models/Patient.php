<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'emergency_contact',
        'insurance_info',
        'medical_history',
        'blood_type',
        'allergies',
        'chronic_conditions',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function medicalNotes()
    {
        return $this->hasManyThrough(MedicalNote::class, Appointment::class);
    }

    // Accessors
    public function getFullNameAttribute()
    {
        return $this->user->name;
    }

    public function getEmailAttribute()
    {
        return $this->user->email;
    }

    public function getPhoneAttribute()
    {
        return $this->user->phone;
    }

    public function getAgeAttribute()
    {
        return $this->user->age;
    }

    // Methods
// في Patient.php - استبدل:

    public function upcomingAppointments()
    {
        return $this->appointments()
            ->where('appointment_date', '>=', Carbon::today()->toDateString())
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('appointment_date')
            ->orderBy('start_time');
    }

    public function pastAppointments()
    {
        return $this->appointments()
            ->where(function ($query) {
                $query->where('appointment_date', '<', Carbon::today()->toDateString())
                    ->orWhere('status', 'completed');
            })
            ->orderBy('appointment_date', 'desc')
            ->orderBy('start_time', 'desc');
    }
}
