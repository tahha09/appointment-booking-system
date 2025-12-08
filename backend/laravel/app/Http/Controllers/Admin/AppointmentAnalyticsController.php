<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Payment;
use App\Models\User;
use App\Models\Doctor;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AppointmentAnalyticsController extends Controller
{
    use ApiResponse;

    /**
     * Get appointment analytics overview
     */
    public function overview(Request $request)
    {
        try {
            $today = Carbon::today();
            $thisMonth = Carbon::now()->startOfMonth();
            $lastMonth = Carbon::now()->subMonth()->startOfMonth();

            // Total appointments
            $totalAppointments = Appointment::count();

            // Today's appointments
            $todaysAppointments = Appointment::whereDate('appointment_date', $today)->count();

            // This month's appointments
            $thisMonthAppointments = Appointment::whereBetween('appointment_date', [
                $thisMonth,
                Carbon::now()->endOfMonth()
            ])->count();

            // Last month's appointments
            $lastMonthAppointments = Appointment::whereBetween('appointment_date', [
                $lastMonth,
                $lastMonth->copy()->endOfMonth()
            ])->count();

            // Appointment status breakdown
            $statusBreakdown = Appointment::select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [$item->status => $item->count];
                });

            // Total revenue
            $totalRevenue = Payment::where('status', 'completed')->sum('amount');

            // This month's revenue
            $thisMonthRevenue = Payment::where('status', 'completed')
                ->whereBetween('paid_at', [$thisMonth, Carbon::now()->endOfMonth()])
                ->sum('amount');

            // Last month's revenue
            $lastMonthRevenue = Payment::where('status', 'completed')
                ->whereBetween('paid_at', [$lastMonth, $lastMonth->copy()->endOfMonth()])
                ->sum('amount');

            // Pending payments count
            $pendingPayments = Payment::where('status', 'pending')->count();

            // Calculate percentage changes
            $appointmentChange = $lastMonthAppointments > 0
                ? (($thisMonthAppointments - $lastMonthAppointments) / $lastMonthAppointments) * 100
                : ($thisMonthAppointments > 0 ? 100 : 0);

            $revenueChange = $lastMonthRevenue > 0
                ? (($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100
                : ($thisMonthRevenue > 0 ? 100 : 0);

            return $this->success([
                'total_appointments' => $totalAppointments,
                'todays_appointments' => $todaysAppointments,
                'this_month_appointments' => $thisMonthAppointments,
                'last_month_appointments' => $lastMonthAppointments,
                'appointment_change_percent' => round($appointmentChange, 2),
                'total_revenue' => (float) $totalRevenue,
                'this_month_revenue' => (float) $thisMonthRevenue,
                'last_month_revenue' => (float) $lastMonthRevenue,
                'revenue_change_percent' => round($revenueChange, 2),
                'pending_payments' => $pendingPayments,
                'status_breakdown' => $statusBreakdown,
            ], 'Appointment analytics overview retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get appointment trends by period
     */
    public function appointmentTrends(Request $request)
    {
        try {
            $period = $request->get('period', 'month'); // 'day', 'week', 'month'
            $limit = $request->get('limit', 12); // Number of periods to return

            $data = [];

            if ($period === 'day') {
                // Last N days
                $startDate = Carbon::now()->subDays($limit - 1)->startOfDay();
                $endDate = Carbon::now()->endOfDay();

                $dates = [];
                for ($i = 0; $i < $limit; $i++) {
                    $dates[] = $startDate->copy()->addDays($i)->toDateString();
                }

                foreach ($dates as $date) {
                    $carbonDate = Carbon::parse($date);

                    $appointments = Appointment::whereDate('appointment_date', $date)
                        ->select('status', DB::raw('COUNT(*) as count'))
                        ->groupBy('status')
                        ->get()
                        ->mapWithKeys(function ($item) {
                            return [$item->status => $item->count];
                        });

                    $revenue = Payment::where('status', 'completed')
                        ->whereDate('paid_at', $date)
                        ->sum('amount');

                    $data[] = [
                        'period' => $date,
                        'label' => $carbonDate->format('M j'),
                        'total_appointments' => $appointments->sum(),
                        'completed' => $appointments->get('completed', 0),
                        'confirmed' => $appointments->get('confirmed', 0),
                        'pending' => $appointments->get('pending', 0),
                        'cancelled' => $appointments->get('cancelled', 0),
                        'revenue' => (float) $revenue,
                    ];
                }
            } else {
                // Monthly data (default)
                $months = [];
                $now = Carbon::now();

                for ($i = $limit - 1; $i >= 0; $i--) {
                    $date = $now->copy()->subMonths($i);
                    $months[] = [
                        'period' => $date->format('Y-m'),
                        'label' => $date->format('M Y'),
                        'date' => $date,
                    ];
                }

                foreach ($months as $month) {
                    $startOfMonth = $month['date']->copy()->startOfMonth();
                    $endOfMonth = $month['date']->copy()->endOfMonth();

                    $appointments = Appointment::whereBetween('appointment_date', [$startOfMonth, $endOfMonth])
                        ->select('status', DB::raw('COUNT(*) as count'))
                        ->groupBy('status')
                        ->get()
                        ->mapWithKeys(function ($item) {
                            return [$item->status => $item->count];
                        });

                    $revenue = Payment::where('status', 'completed')
                        ->whereBetween('paid_at', [$startOfMonth, $endOfMonth])
                        ->sum('amount');

                    $data[] = [
                        'period' => $month['period'],
                        'label' => $month['label'],
                        'total_appointments' => $appointments->sum(),
                        'completed' => $appointments->get('completed', 0),
                        'confirmed' => $appointments->get('confirmed', 0),
                        'pending' => $appointments->get('pending', 0),
                        'cancelled' => $appointments->get('cancelled', 0),
                        'revenue' => (float) $revenue,
                    ];
                }
            }

            return $this->success([
                'trends' => $data,
                'period' => $period,
            ], 'Appointment trends retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get revenue analytics
     */
    public function revenueAnalytics(Request $request)
    {
        try {
            // Revenue by payment method
            $paymentMethods = Payment::where('status', 'completed')
                ->select('payment_method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                ->groupBy('payment_method')
                ->get();

            // Revenue by month (last 12 months)
            $revenueByMonth = [];
            $now = Carbon::now();

            for ($i = 11; $i >= 0; $i--) {
                $date = $now->copy()->subMonths($i);
                $startOfMonth = $date->copy()->startOfMonth();
                $endOfMonth = $date->copy()->endOfMonth();

                $revenue = Payment::where('status', 'completed')
                    ->whereBetween('paid_at', [$startOfMonth, $endOfMonth])
                    ->sum('amount');

                $count = Payment::where('status', 'completed')
                    ->whereBetween('paid_at', [$startOfMonth, $endOfMonth])
                    ->count();

                $revenueByMonth[] = [
                    'month' => $date->format('Y-m'),
                    'label' => $date->format('M Y'),
                    'revenue' => (float) $revenue,
                    'payment_count' => $count,
                ];
            }

            // Today's revenue
            $todayRevenue = Payment::where('status', 'completed')
                ->whereDate('paid_at', Carbon::today())
                ->sum('amount');

            // This week's revenue
            $thisWeekRevenue = Payment::where('status', 'completed')
                ->whereBetween('paid_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
                ->sum('amount');

            // Average payment amount
            $avgPayment = Payment::where('status', 'completed')->avg('amount');

            // Pending payments
            $pendingPayments = Payment::where('status', 'pending')->count();

            return $this->success([
                'payment_methods' => $paymentMethods,
                'revenue_by_month' => $revenueByMonth,
                'today_revenue' => (float) $todayRevenue,
                'this_week_revenue' => (float) $thisWeekRevenue,
                'average_payment' => (float) $avgPayment,
                'pending_payments' => $pendingPayments,
            ], 'Revenue analytics retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get doctor performance analytics
     */
    public function doctorPerformance(Request $request)
    {
        try {
            $page = $request->get('page', 1);
            $limit = $request->get('limit', 5);
            $offset = ($page - 1) * $limit;

            $doctors = Doctor::with('user')->whereHas('user', function($query) {
                $query->where('status', 'active');
            })->get();

            $doctorStats = [];

            foreach ($doctors as $doctor) {
                $appointmentIds = Appointment::where('doctor_id', $doctor->id)->pluck('id');

                // Appointment counts by status
                $appointments = Appointment::where('doctor_id', $doctor->id)
                    ->select('status', DB::raw('COUNT(*) as count'))
                    ->groupBy('status')
                    ->get()
                    ->mapWithKeys(function ($item) {
                        return [$item->status => $item->count];
                    });

                // Revenue
                $revenue = Payment::whereIn('appointment_id', $appointmentIds)
                    ->where('status', 'completed')
                    ->sum('amount');

                // This month revenue
                $thisMonthRevenue = Payment::whereIn('appointment_id', $appointmentIds)
                    ->where('status', 'completed')
                    ->whereMonth('paid_at', Carbon::now()->month)
                    ->whereYear('paid_at', Carbon::now()->year)
                    ->sum('amount');

                // Average rating (if you have ratings system)
                $avgRating = 4.5; // Placeholder - you might have a ratings table

                // Specialization
                $specialization = $doctor->specialization?->name ?? 'General';

                $doctorStats[] = [
                    'id' => $doctor->id,
                    'name' => $doctor->user->name ?? 'Unknown Doctor',
                    'email' => $doctor->user->email ?? '',
                    'specialization' => $specialization,
                    'total_appointments' => $appointments->sum(),
                    'completed_appointments' => $appointments->get('completed', 0),
                    'pending_appointments' => $appointments->get('pending', 0),
                    'cancelled_appointments' => $appointments->get('cancelled', 0),
                    'total_revenue' => (float) $revenue,
                    'this_month_revenue' => (float) $thisMonthRevenue,
                    'average_rating' => $avgRating,
                    'profile_image' => $doctor->user->profile_image ?? null,
                ];
            }

            // Sort by total appointments (descending)
            usort($doctorStats, function($a, $b) {
                return $b['total_appointments'] <=> $a['total_appointments'];
            });

            $totalDoctors = count($doctorStats);
            $paginatedDoctors = array_slice($doctorStats, $offset, $limit);
            $totalPages = ceil($totalDoctors / $limit);

            return $this->success([
                'doctors' => $paginatedDoctors,
                'total_doctors' => $totalDoctors,
                'current_page' => $page,
                'per_page' => $limit,
                'total_pages' => $totalPages,
            ], 'Doctor performance analytics retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get patient analytics
     */
    public function patientAnalytics(Request $request)
    {
        try {
            $page = $request->get('page', 1);
            $limit = $request->get('limit', 5);
            $offset = ($page - 1) * $limit;

            // New patients this month
            $newPatientsThisMonth = User::where('role', 'patient')
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->count();

            // Total patients
            $totalPatients = User::where('role', 'patient')->count();

            // Patients with appointments this month
            $activePatientsThisMonth = Appointment::whereMonth('appointment_date', Carbon::now()->month)
                ->whereYear('appointment_date', Carbon::now()->year)
                ->distinct('patient_id')
                ->count('patient_id');

            // Average appointments per patient
            $avgAppointmentsPerPatient = $totalPatients > 0
                ? round(Appointment::count() / $totalPatients, 2)
                : 0;

            // Top patients by appointment count (last 3 months)
            $baseQuery = DB::table('appointments')
                ->join('patients', 'appointments.patient_id', '=', 'patients.id')
                ->join('users', 'patients.user_id', '=', 'users.id')
                ->select('users.name', 'users.email', DB::raw('COUNT(appointments.id) as appointment_count'))
                ->whereBetween('appointment_date', [Carbon::now()->subMonths(3), Carbon::now()])
                ->groupBy('patients.id', 'users.name', 'users.email');

            $allTopPatients = $baseQuery->get()->sortByDesc('appointment_count');
            $totalTopPatients = $allTopPatients->count();
            $topPatients = $allTopPatients->skip($offset)->take($limit)->values()->toArray();
            $totalPages = ceil($totalTopPatients / $limit);

            return $this->success([
                'total_patients' => $totalPatients,
                'new_patients_this_month' => $newPatientsThisMonth,
                'active_patients_this_month' => $activePatientsThisMonth,
                'avg_appointments_per_patient' => $avgAppointmentsPerPatient,
                'top_patients' => $topPatients,
                'current_page' => $page,
                'per_page' => $limit,
                'total_pages' => $totalPages,
            ], 'Patient analytics retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
