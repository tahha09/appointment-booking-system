<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'symptoms',
        'diagnosis',
        'prescription',
        'follow_up_notes',
        'ai_generated_notes',
    ];

    // Relationships
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function doctor()
    {
        return $this->hasOneThrough(Doctor::class, Appointment::class, 'id', 'id', 'appointment_id', 'doctor_id');
    }

    public function patient()
    {
        return $this->hasOneThrough(Patient::class, Appointment::class, 'id', 'id', 'appointment_id', 'patient_id');
    }

    // Accessors
    public function getHasNotesAttribute()
    {
        return !empty($this->symptoms) || !empty($this->diagnosis) || !empty($this->prescription);
    }

    // Methods
    public function generateSummary()
    {
        $summary = [];

        if ($this->symptoms)
            $summary[] = "Symptoms: {$this->symptoms}";
        if ($this->diagnosis)
            $summary[] = "Diagnosis: {$this->diagnosis}";
        if ($this->prescription)
            $summary[] = "Prescription: {$this->prescription}";

        return implode(' | ', $summary);
    }
}
