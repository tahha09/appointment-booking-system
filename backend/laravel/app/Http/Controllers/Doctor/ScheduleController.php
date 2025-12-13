<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Schedule;
use App\Models\Holiday;
use App\Traits\ApiResponse;
use Carbon\Carbon;

class ScheduleController extends Controller
{
    use ApiResponse;

    /**
     * Get doctor's schedule
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;
            $schedules = Schedule::where('doctor_id', $doctorId)
                ->orderBy('day_of_week')
                ->orderBy('start_time')
                ->get();

            $holidays = Holiday::where('doctor_id', $doctorId)
                ->where('holiday_date', '>=', Carbon::today())
                ->orderBy('holiday_date')
                ->get();

            return $this->success([
                'schedules' => $schedules,
                'holidays' => $holidays,
            ], 'Schedule retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Create a new schedule slot
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $validated = $request->validate([
                'day_of_week' => 'required|integer|min:0|max:6',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
                'is_available' => 'boolean',
            ]);

            // Check for overlapping schedules on the same day
            $doctorId = $user->doctor->id;
            // $overlapping = Schedule::where('doctor_id', $doctorId)
            //     ->where('day_of_week', $validated['day_of_week'])
            //     ->where(function ($query) use ($validated) {
            //         $query->where('start_time', '<', $validated['end_time'])
            //             ->where('end_time', '>', $validated['start_time']);
            //     })
            //     ->exists();

            // if ($overlapping) {
            //     return $this->error('This time slot overlaps with an existing schedule.', 422);
            // }

            $schedule = Schedule::create([
                'doctor_id' => $doctorId,
                'day_of_week' => $validated['day_of_week'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'is_available' => $validated['is_available'] ?? true,
            ]);

            return $this->success($schedule, 'Schedule created successfully', 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation failed: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Update a schedule slot
     */
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $schedule = Schedule::where('doctor_id', $user->doctor->id)->find($id);

            if (!$schedule) {
                return $this->error('Schedule not found.', 404);
            }

            $validated = $request->validate([
                'day_of_week' => 'sometimes|integer|min:0|max:6',
                'start_time' => 'sometimes|date_format:H:i',
                'end_time' => 'sometimes|date_format:H:i|after:start_time',
                'is_available' => 'boolean',
            ]);

            // Check for overlapping schedules (excluding current schedule)
            // if (isset($validated['day_of_week']) || isset($validated['start_time']) || isset($validated['end_time'])) {
            //     $dayOfWeek = $validated['day_of_week'] ?? $schedule->day_of_week;
            //     $startTime = $validated['start_time'] ?? $schedule->start_time;
            //     $endTime = $validated['end_time'] ?? $schedule->end_time;

            //     $overlapping = Schedule::where('doctor_id', $user->doctor->id)
            //         ->where('id', '!=', $id)
            //         ->where('day_of_week', $dayOfWeek)
            //         ->where(function ($query) use ($startTime, $endTime) {
            //             $query->where('start_time', '<', $endTime)
            //                 ->where('end_time', '>', $startTime);
            //         })
            //         ->exists();

            //     if ($overlapping) {
            //         return $this->error('This time slot overlaps with an existing schedule.', 422);
            //     }
            // }

            $schedule->update($validated);

            return $this->success($schedule, 'Schedule updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation failed: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Delete a schedule slot
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $schedule = Schedule::where('doctor_id', $user->doctor->id)->find($id);

            if (!$schedule) {
                return $this->error('Schedule not found.', 404);
            }

            $schedule->delete();

            return $this->success(null, 'Schedule deleted successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Add a holiday
     */
    public function addHoliday(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $validated = $request->validate([
                'holiday_date' => 'required|date|after_or_equal:today',
                'reason' => 'nullable|string|max:255',
            ]);

            $doctorId = $user->doctor->id;

            // Check if holiday already exists
            $existingHoliday = Holiday::where('doctor_id', $doctorId)
                ->where('holiday_date', $validated['holiday_date'])
                ->first();

            if ($existingHoliday) {
                return $this->error('Holiday already exists for this date.', 422);
            }

            $holiday = Holiday::create([
                'doctor_id' => $doctorId,
                'holiday_date' => $validated['holiday_date'],
                'reason' => $validated['reason'] ?? null,
            ]);

            return $this->success($holiday, 'Holiday added successfully', 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation failed: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Remove a holiday
     */
    public function removeHoliday(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $holiday = Holiday::where('doctor_id', $user->doctor->id)->find($id);

            if (!$holiday) {
                return $this->error('Holiday not found.', 404);
            }

            $holiday->delete();

            return $this->success(null, 'Holiday removed successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
