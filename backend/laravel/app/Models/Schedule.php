<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_available',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'is_available' => 'boolean',
    ];

    // Relationships
    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeForDay($query, $dayOfWeek)
    {
        return $query->where('day_of_week', $dayOfWeek);
    }

    // Accessors
    public function getDayNameAttribute()
    {
        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return $days[$this->day_of_week] ?? 'Unknown';
    }

    public function getTimeSlotAttribute()
    {
        return "{$this->start_time} - {$this->end_time}";
    }

    // Mutators
    public function setDayOfWeekAttribute($value)
    {
        $this->attributes['day_of_week'] = (string) (is_numeric($value) ? (int) $value : $value);
    }

    // Methods
    public function isTimeInSlot($time)
    {
        $time = Carbon::parse($time);
        $start = Carbon::parse($this->start_time);
        $end = Carbon::parse($this->end_time);

        return $time->between($start, $end);
    }
}
