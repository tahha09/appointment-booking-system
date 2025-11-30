<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DoctorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'specialization_id' => $this->specialization_id,
            'license_number' => $this->license_number,
            'experience_years' => $this->experience_years,
            'consultation_fee' => (string) number_format($this->consultation_fee, 2, '.', ''),
            'biography' => $this->biography,
            'rating' => (string) number_format($this->rating, 2, '.', ''),
            'is_approved' => $this->is_approved,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'phone' => $this->user->phone,
                    'profile_image' => $this->user->profile_image,
                    'date_of_birth' => $this->user->date_of_birth,
                    'address' => $this->user->address,
                ];
            }),
            'specialization' => $this->whenLoaded('specialization', function () {
                return [
                    'id' => $this->specialization->id,
                    'name' => $this->specialization->name,
                    'description' => $this->specialization->description,
                ];
            }),
        ];
    }
}
