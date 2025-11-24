<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class CreatePaymentRequest extends FormRequest
{
    public function rules()
    {
        return [
            'appointment_id' => 'required|exists:appointments,id',
            'payment_method' => 'required|in:card,cash,wallet',
        ];
    }
}
