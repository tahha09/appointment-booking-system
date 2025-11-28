<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SpecializationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'doctors_count' => $this->doctors_count ?? $this->doctors()->where('is_approved', true)->count(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),

            // Additional computed fields
            'is_popular' => ($this->doctors_count ?? 0) > 10,
            'has_available_doctors' => ($this->doctors_count ?? 0) > 0,
        ];
    }
}
