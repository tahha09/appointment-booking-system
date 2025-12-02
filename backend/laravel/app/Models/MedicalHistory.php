<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory; // Added this line

class MedicalHistory extends Model
{
    use HasFactory; // Moved this line here

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'condition',
        'diagnosis',
        'treatment',
        'notes',
        'visit_date',
    ];

    protected $casts = [
        'visit_date' => 'date',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
}
