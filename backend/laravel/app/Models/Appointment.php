<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'appointment_date',
        'start_time',
        'end_time',
        'status',
        'reason',
        'notes',
    ];

    protected $casts = [
        'appointment_date' => 'date',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function medicalNote()
    {
        return $this->hasOne(MedicalNote::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'related_appointment_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeUpcoming($query)
    {
        return $query->where('appointment_date', '>=', Carbon::today()->toDateString())
            ->whereIn('status', ['pending', 'confirmed']);
    }

    public function scopePast($query)
    {
        return $query->where(function ($q) {
            $q->where('appointment_date', '<', Carbon::today()->toDateString())
                ->orWhere('status', 'completed');
        });
    }

    public function scopeForDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    public function scopeForPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    // Accessors
    public function getDateTimeAttribute()
    {
        return "{$this->appointment_date} {$this->start_time}";
    }

    public function getIsUpcomingAttribute()
    {
        $appointmentDate = Carbon::parse($this->appointment_date);
        $today = Carbon::today();

        return $appointmentDate->gte($today) && in_array($this->status, ['pending', 'confirmed']);
    }

    public function getIsPastAttribute()
    {
        $appointmentDate = Carbon::parse($this->appointment_date);
        $today = Carbon::today();

        return $appointmentDate->lt($today) || $this->status === 'completed';
    }

    public function getCanBeCancelledAttribute()
    {
        $appointmentDateTime = Carbon::parse("{$this->appointment_date} {$this->start_time}");
        $currentDateTime = Carbon::now();
        $hoursDifference = $appointmentDateTime->diffInHours($currentDateTime, false);

        return $hoursDifference > 24 && in_array($this->status, ['pending', 'confirmed']);
    }
    // Methods
    public function markAsCompleted()
    {
        $this->update(['status' => 'completed']);
    }

    public function cancel()
    {
        $this->update(['status' => 'cancelled']);
    }

    public function confirm()
    {
        $this->update(['status' => 'confirmed']);
    }
}
