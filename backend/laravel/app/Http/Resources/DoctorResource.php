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
                    'profile_image' => $this->resolveStoragePath($this->user->profile_image),
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
            'certificates' => $this->whenLoaded('certificates', function () {
                return $this->certificates->map(function ($certificate) {
                    return [
                        'id' => $certificate->id,
                        'title' => $certificate->title,
                        'description' => $certificate->description,
                        'issuing_organization' => $certificate->issuing_organization,
                        'issue_date' => optional($certificate->issue_date)->toDateString(),
                        'expiry_date' => optional($certificate->expiry_date)->toDateString(),
                        'images' => collect($certificate->images ?? [])
                            ->filter()
                            ->map(function ($image) {
                                return $this->resolveStoragePath($image);
                            })
                            ->filter()
                            ->values()
                            ->all(),
                    ];
                });
            }),
        ];
    }

    private function resolveStoragePath(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (preg_match('/^https?:\/\//', $path)) {
            return $path;
        }

        $normalizedPath = ltrim($path, '/');
        if (str_starts_with($normalizedPath, 'storage/')) {
            return url($normalizedPath);
        }

        return url('storage/' . $normalizedPath);
    }
}
