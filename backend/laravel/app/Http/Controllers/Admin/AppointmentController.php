<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        // Get query parameters
        $perPage = $request->get('per_page', 5); // Default 5 appointments per page
        $search = $request->get('search', '');
        $status = $request->get('status', '');
        $paymentStatus = $request->get('payment_status', '');
        $upcoming = $request->get('upcoming', false);

        // Build query with relationships
        $query = Appointment::with([
            'patient.user',
            'doctor.user'
        ]);

        // Apply search filter (search by patient name or doctor name)
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('patient.user', function ($subQ) use ($search) {
                    $subQ->where('name', 'like', '%' . $search . '%');
                })->orWhereHas('doctor.user', function ($subQ) use ($search) {
                    $subQ->where('name', 'like', '%' . $search . '%');
                });
            });
        }

        // Apply status filter
        if (!empty($status) && $status !== 'ALL') {
            // Handle "upcoming" as a special status filter
            if ($status === 'upcoming') {
                $today = now()->format('Y-m-d');
                $query->where('appointment_date', '>=', $today);
            } else {
                $query->where('status', $status);
            }
        }

        // Apply payment status filter
        if (!empty($paymentStatus) && $paymentStatus !== 'ALL') {
            $query->where('payment_status', $paymentStatus);
        }

        // Apply upcoming filter (appointments from today onwards) - legacy support
        if ($upcoming) {
            $today = now()->format('Y-m-d');
            $query->where('appointment_date', '>=', $today);
        }

        // Order and paginate
        $appointments = $query
            ->orderBy('appointment_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->paginate($perPage)
            ->through(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'patient_id' => $appointment->patient_id,
                    'doctor_id' => $appointment->doctor_id,
                    'patient_name' => $appointment->patient->user->name ?? 'Unknown Patient',
                    'doctor_name' => $appointment->doctor->user->name ?? 'Unknown Doctor',
                    'date' => $appointment->appointment_date,
                    'time' => $appointment->start_time,
                    'end_time' => $appointment->end_time,
                    'status' => $appointment->status,
                    'type' => $appointment->reason,
                    'notes' => $appointment->notes ?? null,
                    'payment_status' => $appointment->payment_status ?? null,
                    'consultation_fee' => $appointment->consultation_fee ?? null,
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

    public function destroy($id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();

        return response()->json([
            'message' => 'Appointment deleted successfully'
        ], 200);
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
