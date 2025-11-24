<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Specialization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
    ];

    // Relationships
    public function doctors()
    {
        return $this->hasMany(Doctor::class);
    }

    // Scopes
    public function scopeWithApprovedDoctors($query)
    {
        return $query->whereHas('doctors', function ($q) {
            $q->where('is_approved', true);
        });
    }

    // Accessors
    public function getDoctorsCountAttribute()
    {
        return $this->doctors()->where('is_approved', true)->count();
    }
}
