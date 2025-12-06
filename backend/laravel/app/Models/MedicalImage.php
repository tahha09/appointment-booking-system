<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'title',
        'description',
        'image_type',
        'images',
    ];

    protected $casts = [
        'images' => 'array',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
}
