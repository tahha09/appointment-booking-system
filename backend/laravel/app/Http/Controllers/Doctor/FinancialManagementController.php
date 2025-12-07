<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Appointment;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinancialManagementController extends Controller
{
    use ApiResponse;

    /**
     * Get financial overview/statistics
     */
    public function overview(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;

            // Get all appointments for this doctor
            $appointmentIds = Appointment::where('doctor_id', $doctorId)->pluck('id');

            // Total revenue (all time)
            $totalRevenue = Payment::whereIn('appointment_id', $appointmentIds)
                ->where('status', 'completed')
                ->sum('amount');

            // This month revenue
            $thisMonthRevenue = Payment::whereIn('appointment_id', $appointmentIds)
                ->where('status', 'completed')
                ->whereMonth('paid_at', Carbon::now()->month)
                ->whereYear('paid_at', Carbon::now()->year)
                ->sum('amount');

            // Last month revenue
            $lastMonthRevenue = Payment::whereIn('appointment_id', $appointmentIds)
                ->where('status', 'completed')
                ->whereMonth('paid_at', Carbon::now()->subMonth()->month)
                ->whereYear('paid_at', Carbon::now()->subMonth()->year)
                ->sum('amount');

            // Total completed payments
            $totalPayments = Payment::whereIn('appointment_id', $appointmentIds)
                ->where('status', 'completed')
                ->count();

            // Pending payments
            $pendingPayments = Payment::whereIn('appointment_id', $appointmentIds)
                ->where('status', 'pending')
                ->count();

            // This month payments count
            $thisMonthPayments = Payment::whereIn('appointment_id', $appointmentIds)
                ->where('status', 'completed')
                ->whereMonth('paid_at', Carbon::now()->month)
                ->whereYear('paid_at', Carbon::now()->year)
                ->count();

            // Calculate percentage change
            $revenueChange = $lastMonthRevenue > 0
                ? (($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100
                : ($thisMonthRevenue > 0 ? 100 : 0);

            return $this->success([
                'total_revenue' => (float) $totalRevenue,
                'this_month_revenue' => (float) $thisMonthRevenue,
                'last_month_revenue' => (float) $lastMonthRevenue,
                'revenue_change_percent' => round($revenueChange, 2),
                'total_payments' => $totalPayments,
                'pending_payments' => $pendingPayments,
                'this_month_payments' => $thisMonthPayments,
            ], 'Financial overview retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get revenue by period (monthly for last 6 months)
     */
    public function revenueByPeriod(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;
            $appointmentIds = Appointment::where('doctor_id', $doctorId)->pluck('id');

            $months = [];
            $now = Carbon::now();

            // Get last 6 months
            for ($i = 5; $i >= 0; $i--) {
                $date = $now->copy()->subMonths($i);
                $monthKey = $date->format('Y-m');

                $revenue = Payment::whereIn('appointment_id', $appointmentIds)
                    ->where('status', 'completed')
                    ->whereYear('paid_at', $date->year)
                    ->whereMonth('paid_at', $date->month)
                    ->sum('amount');

                $count = Payment::whereIn('appointment_id', $appointmentIds)
                    ->where('status', 'completed')
                    ->whereYear('paid_at', $date->year)
                    ->whereMonth('paid_at', $date->month)
                    ->count();

                $months[] = [
                    'month' => $monthKey,
                    'label' => $date->format('M Y'),
                    'revenue' => (float) $revenue,
                    'payment_count' => $count,
                ];
            }

            return $this->success([
                'revenue_by_month' => $months,
            ], 'Revenue by period retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get payment history
     */
    public function paymentHistory(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;
            $appointmentIds = Appointment::where('doctor_id', $doctorId)->pluck('id');

            $query = Payment::with(['appointment.patient.user', 'patient.user'])
                ->whereIn('appointment_id', $appointmentIds);

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filter by date range
            if ($request->has('date_from')) {
                $query->whereDate('paid_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('paid_at', '<=', $request->date_to);
            }

            // Order by date
            $query->orderBy('paid_at', 'desc');

            // Pagination
            $perPage = $request->get('per_page', 5);
            $payments = $query->paginate($perPage);

            return $this->success([
                'payments' => $payments->items(),
                'pagination' => [
                    'current_page' => $payments->currentPage(),
                    'last_page' => $payments->lastPage(),
                    'per_page' => $payments->perPage(),
                    'total' => $payments->total(),
                ]
            ], 'Payment history retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get financial statistics summary
     */
    public function statistics(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;
            $appointmentIds = Appointment::where('doctor_id', $doctorId)->pluck('id');

            // Today's revenue
            $todayRevenue = Payment::whereIn('appointment_id', $appointmentIds)
                ->where('status', 'completed')
                ->whereDate('paid_at', Carbon::today())
                ->sum('amount');

            // This week's revenue
            $thisWeekRevenue = Payment::whereIn('appointment_id', $appointmentIds)
                ->where('status', 'completed')
                ->whereBetween('paid_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
                ->sum('amount');

            // Average payment amount
            $avgPayment = Payment::whereIn('appointment_id', $appointmentIds)
                ->where('status', 'completed')
                ->avg('amount');

            // Payment methods breakdown
            $paymentMethods = Payment::whereIn('appointment_id', $appointmentIds)
                ->where('status', 'completed')
                ->select('payment_method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                ->groupBy('payment_method')
                ->get();

            return $this->success([
                'today_revenue' => (float) $todayRevenue,
                'this_week_revenue' => (float) $thisWeekRevenue,
                'average_payment' => (float) $avgPayment,
                'payment_methods' => $paymentMethods,
            ], 'Financial statistics retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}

