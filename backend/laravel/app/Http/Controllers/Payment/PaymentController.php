<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\CreatePaymentRequest;
use App\Http\Requests\Payment\ConfirmPaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Appointment;
use App\Services\PaymentService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

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
            $payment = $this->paymentService->createPaymentIntent(
                $request->appointment_id,
                auth()->id(),
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
            $payment = Payment::where('patient_id', auth()->id())->findOrFail($id);

            return $this->success(
                new PaymentResource($payment),
                'Payment retrieved successfully'
            );
        } catch (\Exception $e) {
            return $this->error('Payment not found');
        }
    }

    public function getPatientPayments()
    {
        try {
            $payments = Payment::where('patient_id', auth()->id())
                ->orderBy('created_at', 'desc')
                ->get();

            return $this->success(
                PaymentResource::collection($payments),
                'Payments retrieved successfully'
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function refundPayment($id)
    {
        try {
            $payment = Payment::where('patient_id', auth()->id())->findOrFail($id);

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
}
