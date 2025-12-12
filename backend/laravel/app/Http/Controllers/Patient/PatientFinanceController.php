<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PatientFinanceController extends Controller
{
    use ApiResponse;

    private const PER_PAGE = 5;

    public function index(Request $request)
    {
        $patient = auth()->user()?->patient;
        if (!$patient) {
            return $this->error('Authenticated patient not found.', 404);
        }

        $patientIds = array_unique(array_filter([
            $patient->id,
            $patient->user_id,
            auth()->id(),
        ]));

        $page = max(1, (int) $request->input('page', 1));

        $paymentsQuery = Payment::with([
                'appointment.doctor.user',
                'appointment.doctor.specialization',
            ])
            ->whereIn('patient_id', $patientIds)
            ->orderBy('created_at', 'desc');

        $payments = $paymentsQuery->paginate(self::PER_PAGE, ['*'], 'page', $page);

        $summaryStats = Payment::whereIn('patient_id', $patientIds)
            ->selectRaw("
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_paid,
                SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as total_refunded,
                SUM(CASE WHEN payment_method = 'refunded_balance' THEN amount ELSE 0 END) as refunded_spent,
                SUM(CASE WHEN status IN ('pending','held') THEN amount ELSE 0 END) as total_on_hold,
                MAX(created_at) as last_transaction_at
            ")
            ->first();

        $rawRefunded = (float) ($summaryStats->total_refunded ?? 0);
        $refundedSpent = (float) ($summaryStats->refunded_spent ?? 0);
        $availableRefund = max(0, $rawRefunded - $refundedSpent);

        $cancelledAppointmentRefunds = Payment::whereIn('patient_id', $patientIds)
            ->whereHas('appointment', function ($query) {
                $query->where('status', 'cancelled');
            })
            ->whereIn('status', ['completed', 'refunded', 'held'])
            ->sum('amount');

        $summary = [
            'total_transactions' => (int) ($summaryStats->total_transactions ?? 0),
            'total_paid' => (float) ($summaryStats->total_paid ?? 0),
            'total_refunded' => (float) $cancelledAppointmentRefunds,
            'total_on_hold' => (float) ($summaryStats->total_on_hold ?? 0),
            'last_transaction_at' => $summaryStats?->last_transaction_at
                ? Carbon::parse($summaryStats->last_transaction_at)->toISOString()
                : null,
            'refunded_spent' => $refundedSpent,
        ];

        $transactions = PaymentResource::collection($payments)->resolve();

        return $this->success([
            'transactions' => $transactions,
            'summary' => $summary,
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'per_page' => self::PER_PAGE,
                'last_page' => $payments->lastPage(),
                'total' => $payments->total(),
            ],
        ], 'Finance data retrieved successfully');
    }
}
