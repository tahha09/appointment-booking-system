<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'fullName' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'dateOfBirth' => 'nullable|date|before:today',
            'address' => 'nullable|string|max:500',
            'profileImage' => 'nullable|string',
        ];
    }
}
