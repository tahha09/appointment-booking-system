<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Holiday extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'holiday_date',
        'reason',
    ];

    protected $casts = [
        'holiday_date' => 'date',
    ];

    // Relationships
    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('holiday_date', '>=', Carbon::today()->toDateString());
    }

    public function scopePast($query)
    {
        return $query->where('holiday_date', '<', Carbon::today()->toDateString());
    }

    public function scopeForDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    // Methods
    public function isOnDate($date)
    {
        // Convert holiday_date to Carbon instance first, then format
        $holidayDate = Carbon::parse($this->holiday_date)->format('Y-m-d');
        $checkDate = $date instanceof Carbon ? $date->format('Y-m-d') : Carbon::parse($date)->format('Y-m-d');

        return $holidayDate === $checkDate;
    }

    // Accessors
    public function getFormattedDateAttribute()
    {
        return Carbon::parse($this->holiday_date)->format('Y-m-d');
    }

    public function getReadableDateAttribute()
    {
        return Carbon::parse($this->holiday_date)->format('F j, Y');
    }

    public function getIsUpcomingAttribute()
    {
        return Carbon::parse($this->holiday_date) >= Carbon::today();
    }
}
