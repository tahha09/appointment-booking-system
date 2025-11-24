<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmPaymentRequest extends FormRequest
{
    public function rules()
    {
        return [
            'payment_id' => 'required|exists:payments,id',
            'payment_token' => 'sometimes|string',
        ];
    }
}
