<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'patient_id',
        'amount',
        'currency',
        'payment_method',
        'status',
        'transaction_id',
        'payment_details',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_details' => 'array',
        'paid_at' => 'datetime',
    ];

    // Relationships
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeRefunded($query)
    {
        return $query->where('status', 'refunded');
    }

    public function scopeForPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    // Accessors
    public function getFormattedAmountAttribute()
    {
        return number_format($this->amount, 2) . ' ' . strtoupper($this->currency);
    }

    public function getIsSuccessfulAttribute()
    {
        return $this->status === 'completed';
    }

    public function getIsPendingAttribute()
    {
        return $this->status === 'pending';
    }

    public function getIsFailedAttribute()
    {
        return $this->status === 'failed';
    }

    // Methods
    public function markAsCompleted($transactionId = null, $paymentDetails = null)
    {
        $this->update([
            'status' => 'completed',
            'transaction_id' => $transactionId,
            'payment_details' => $paymentDetails,
            'paid_at' => now(),
        ]);

        // Update appointment payment status
        if ($this->appointment) {
            $this->appointment->update(['payment_status' => 'paid']);
        }
    }

    public function markAsFailed($paymentDetails = null)
    {
        $this->update([
            'status' => 'failed',
            'payment_details' => $paymentDetails,
        ]);

        // Update appointment payment status
        if ($this->appointment) {
            $this->appointment->update(['payment_status' => 'failed']);
        }
    }

    public function markAsRefunded()
    {
        $this->update([
            'status' => 'refunded',
        ]);

        // Update appointment payment status
        if ($this->appointment) {
            $this->appointment->update(['payment_status' => 'refunded']);
        }
    }
}
