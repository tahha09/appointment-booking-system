<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'title',
        'description',
        'issuing_organization',
        'issue_date',
        'expiry_date',
        'images',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'expiry_date' => 'date',
        'images' => 'array',
    ];

    // Relationships
    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
}

