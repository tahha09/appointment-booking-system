<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    // app/Http\Controllers\Admin\AppointmentController.php
    // app/Http\Controllers\Admin\AppointmentController.php
    public function index(Request $request)
    {
        // Get appointments with pagination to prevent memory exhaustion
        $perPage = $request->get('per_page', 15); // Default 15 appointments per page
        $appointments = Appointment::select(
            'id',
            'patient_id',
            'doctor_id',
            'appointment_date',
            'start_time',
            'end_time',
            'status',
            'reason',
            'payment_status',
            'consultation_fee',
            'created_at'
        )
            ->orderBy('appointment_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->paginate($perPage)
            ->through(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'patient_id' => $appointment->patient_id,
                    'doctor_id' => $appointment->doctor_id,
                    'patient_name' => 'Patient #' . $appointment->patient_id, // Simple placeholder
                    'doctor_name' => 'Doctor #' . $appointment->doctor_id,   // Simple placeholder
                    'date' => $appointment->appointment_date,
                    'time' => $appointment->start_time,
                    'end_time' => $appointment->end_time,
                    'status' => $appointment->status,
                    'type' => $appointment->reason,
                    'payment_status' => $appointment->payment_status,
                    'consultation_fee' => $appointment->consultation_fee,
                    'created_at' => $appointment->created_at
                ];
            });

        return response()->json($appointments);
    }

    public function show($id)
    {
        $appointment = Appointment::with(['patient', 'doctor'])->findOrFail($id);
        return response()->json($appointment);
    }

    public function updateStatus(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->status = $request->status;
        $appointment->save();

        return response()->json($appointment);
    }

    public function appointmentReport(Request $request)
    {
        // Get appointments for the last 7 days
        $startDate = Carbon::now()->subDays(7);
        $endDate = Carbon::now();

        $dates = [];
        for ($date = $startDate; $date <= $endDate; $date->addDay()) {
            $dates[$date->format('Y-m-d')] = [
                'date' => $date->format('Y-m-d'),
                'scheduled' => 0,
                'completed' => 0,
                'cancelled' => 0
            ];
        }

        // Get actual data - using appointment_date instead of date
        $appointments = Appointment::whereBetween('appointment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->select('appointment_date', 'status')
            ->get();

        foreach ($appointments as $appointment) {
            $date = $appointment->appointment_date;
            if (isset($dates[$date])) {
                // Note: Your status enum has 'pending','confirmed','cancelled','completed'
                // Adjust these to match your actual status values
                switch ($appointment->status) {
                    case 'confirmed':
                    case 'scheduled':
                        $dates[$date]['scheduled']++;
                        break;
                    case 'completed':
                        $dates[$date]['completed']++;
                        break;
                    case 'cancelled':
                        $dates[$date]['cancelled']++;
                        break;
                    case 'pending':
                        // You might want to handle pending status
                        $dates[$date]['scheduled']++; // Or create a separate count
                        break;
                }
            }
        }

        return response()->json(array_values($dates));
    }
}
