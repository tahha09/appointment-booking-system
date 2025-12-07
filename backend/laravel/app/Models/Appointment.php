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
        'rescheduled_at',
        'original_appointment_date',
        'original_start_time',
        'original_end_time',
        'reschedule_reason',
        'reschedule_count'
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'original_appointment_date' => 'date',
        'rescheduled_at' => 'datetime',
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

    public function getCanBeRescheduledAttribute()
    {
        if ($this->status !== 'confirmed') {
        return false;
    }
    
    if ($this->reschedule_count >= 3) {
        return false;
    }
    
    $originalDateTime = Carbon::parse(
        $this->appointment_date->format('Y-m-d') . ' ' . $this->start_time
    );
    $now = Carbon::now();

    if ($originalDateTime->lt($now)) {
        return false;
    }

    if ($originalDateTime->isSameDay($now)) {
        return false;
    }

    $hoursDifference = $originalDateTime->diffInHours($now, false);
    $minimumHoursBeforeAppointment = 4;
    
    if ($hoursDifference > -$minimumHoursBeforeAppointment) {
        return false;
    }
    
    return true;
    }

    public function getRescheduleRestrictionMessageAttribute()
{
    if ($this->status !== 'confirmed') {
        return 'Only confirmed appointments can be rescheduled.';
    }
    
    if ($this->reschedule_count >= 3) {
        return 'You have reached the maximum reschedule limit (3 times).';
    }
    
    $originalDateTime = Carbon::parse(
        $this->appointment_date->format('Y-m-d') . ' ' . $this->start_time
    );
    $now = Carbon::now();
    
    if ($originalDateTime->lt($now)) {
        return 'Cannot reschedule an appointment that has already passed.';
    }
    
    if ($originalDateTime->isSameDay($now)) {
        return 'Cannot reschedule an appointment on the same day.';
    }
    
    $hoursDifference = $originalDateTime->diffInHours($now, false);
    $minimumHoursBeforeAppointment = 4;
    
    if ($hoursDifference > -$minimumHoursBeforeAppointment) {
        return "Cannot reschedule an appointment less than {$minimumHoursBeforeAppointment} hours before the scheduled time.";
    }
    
    return 'Rescheduling is allowed.';
}
    
    public function getIsRescheduledAttribute()
    {
        return !is_null($this->rescheduled_at);
    }
    
    public function getRemainingReschedulesAttribute()
    {
        return 3 - $this->reschedule_count;
    }
}
