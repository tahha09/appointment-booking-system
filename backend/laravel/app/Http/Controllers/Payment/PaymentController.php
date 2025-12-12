<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\CreatePaymentRequest;
use App\Http\Requests\Payment\ConfirmPaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    use ApiResponse;

    protected $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function createPaymentIntent(CreatePaymentRequest $request)
    {
        try {
            $patient = auth()->user()?->patient;
            if (!$patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $payment = $this->paymentService->createPaymentIntent(
                $request->appointment_id,
                $patient->id,
                $request->payment_method
            );

            return $this->success(
                new PaymentResource($payment),
                'Payment intent created successfully'
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function confirmPayment(ConfirmPaymentRequest $request)
    {
        try {
            $payment = $this->paymentService->processPayment(
                $request->payment_id,
                $request->payment_token
            );

            return $this->success(
                new PaymentResource($payment),
                'Payment completed successfully'
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function getPayment($id)
    {
        try {
            $patient = auth()->user()?->patient;
            if (!$patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $patientIds = array_unique(array_filter([$patient->id, $patient->user_id, auth()->id()]));

            $payment = Payment::with(['appointment.doctor.user', 'appointment.doctor.specialization'])
                ->whereIn('patient_id', $patientIds)
                ->findOrFail($id);

            return $this->success(
                new PaymentResource($payment),
                'Payment retrieved successfully'
            );
        } catch (\Exception $e) {
            return $this->error('Payment not found');
        }
    }

    public function refundPayment($id)
    {
        try {
            $patient = auth()->user()?->patient;
            if (!$patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $patientIds = array_unique(array_filter([$patient->id, $patient->user_id, auth()->id()]));
            $payment = Payment::whereIn('patient_id', $patientIds)->findOrFail($id);

            if ($payment->status !== 'completed') {
                return $this->error('Only completed payments can be refunded');
            }

            $refundedPayment = $this->paymentService->processRefund($payment);

            return $this->success(
                new PaymentResource($refundedPayment),
                'Payment refunded successfully'
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    /**
     * Public endpoint to store upfront payments without an appointment
     */
    public function publicStore(Request $request)
    {
        try {
            $user = auth()->user();
            $patient = $user?->patient;

            if (!$patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

                $validated = $request->validate([
                    'doctor_id' => 'required|exists:doctors,id',
                    'doctor_name' => 'required|string|max:255',
                    'doctor_department' => 'nullable|string|max:255',
                    'fee' => 'required|numeric|min:0',
                    // amount is required unless payment_method is cash
                    'amount' => 'required_unless:payment_method,cash,refunded_balance|numeric|min:0',
                    'currency' => 'nullable|string|size:3',
                    'payment_method' => 'required|in:credit_card,cash,refunded_balance',
                    'patient_name' => 'required|string|max:255',
                    'patient_email' => 'nullable|email|max:255',
                    'payment_details' => 'nullable|array',
                    'appointment_id' => 'nullable|exists:appointments,id',
                ]);

            $minimumDeposit = $validated['fee'] * 0.5;
                // Only enforce minimum deposit for non-cash payments
                if (($validated['payment_method'] ?? '') !== 'cash' && $validated['payment_method'] !== 'refunded_balance') {
                    if (!isset($validated['amount']) || $validated['amount'] < $minimumDeposit) {
                        return $this->error('Deposit must be at least 50% of the doctor fee.', 422);
                    }
                }

            if (($validated['payment_method'] ?? '') === 'refunded_balance') {
                $patientIds = array_unique(array_filter([$patient->id, $patient->user_id, auth()->id()]));
                $availableRefund = $this->getAvailableRefundBalance($patientIds);
                if ($availableRefund < $minimumDeposit) {
                    return $this->error('Your refunded balance is not enough to cover the required 50% deposit.', 422);
                }
                $validated['amount'] = $minimumDeposit;
            }

            $currency = strtoupper($validated['currency'] ?? 'USD');
            if (strlen($currency) !== 3) {
                $currency = 'USD';
            }

            $payment = Payment::create([
                'appointment_id' => $validated['appointment_id'] ?? null,
                'patient_id' => $patient->id,
                    // store 0 when amount is not provided (e.g. cash on visit)
                    'amount' => $validated['amount'] ?? 0,
                'currency' => $currency,
                'payment_method' => $validated['payment_method'],
                'status' => 'completed',
                'transaction_id' => 'public_' . Str::upper(Str::random(12)),
                'payment_details' => [
                    'doctor' => [
                        'id' => $validated['doctor_id'],
                        'name' => $validated['doctor_name'],
                        'department' => $validated['doctor_department'],
                        'fee' => $validated['fee'],
                    ],
                    'patient' => [
                        'name' => $validated['patient_name'],
                        'email' => $validated['patient_email'] ?? null,
                    ],
                    'method_payload' => $validated['payment_details'] ?? [],
                ],
                'paid_at' => now(),
            ]);

            return $this->success(new PaymentResource($payment), 'Payment recorded successfully');
        } catch (ValidationException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    private function getAvailableRefundBalance(array $patientIds): float
    {
        $refundedSpent = Payment::whereIn('patient_id', $patientIds)
            ->where('payment_method', 'refunded_balance')
            ->sum('amount');

        $cancelledAppointmentRefunds = Payment::whereIn('patient_id', $patientIds)
            ->whereHas('appointment', function ($query) {
                $query->where('status', 'cancelled');
            })
            ->whereIn('status', ['completed', 'refunded', 'held'])
            ->sum('amount');

        $available = (float) $cancelledAppointmentRefunds - (float) $refundedSpent;
        return $available > 0 ? $available : 0;
    }
}
