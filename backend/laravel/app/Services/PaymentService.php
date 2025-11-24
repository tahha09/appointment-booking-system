<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Appointment;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    public function createPaymentIntent($appointmentId, $patientId, $paymentMethod = 'card')
    {
        return DB::transaction(function () use ($appointmentId, $patientId, $paymentMethod) {
            // Get appointment and verify it exists
            $appointment = Appointment::findOrFail($appointmentId);

            // Verify patient owns the appointment
            if ($appointment->patient_id != $patientId) {
                throw new \Exception('Unauthorized access to appointment');
            }

            // Check if payment already exists and is pending
            $existingPayment = Payment::where('appointment_id', $appointmentId)
                ->where('status', 'pending')
                ->first();

            if ($existingPayment) {
                return $existingPayment;
            }

            // Calculate amount (use doctor's consultation fee)
            $amount = $appointment->doctor->consultation_fee;

            // Create payment record
            $payment = Payment::create([
                'appointment_id' => $appointmentId,
                'patient_id' => $patientId,
                'amount' => $amount,
                'currency' => 'USD',
                'payment_method' => $paymentMethod,
                'status' => 'pending',
            ]);

            // For demo purposes, simulate payment gateway response
            $paymentIntent = [
                'payment_id' => $payment->id,
                'amount' => $amount,
                'currency' => 'USD',
                'client_secret' => 'demo_client_secret_' . uniqid(),
                'status' => 'requires_payment_method',
            ];

            return $payment;
        });
    }

    public function processPayment($paymentId, $paymentToken = null)
    {
        return DB::transaction(function () use ($paymentId, $paymentToken) {
            $payment = Payment::findOrFail($paymentId);

            if ($payment->status === 'completed') {
                throw new \Exception('Payment already completed');
            }

            if ($payment->status === 'failed') {
                throw new \Exception('Payment already failed');
            }

            // Simulate payment processing (in real app, call payment gateway API)
            sleep(2); // Simulate API call delay

            // For demo: 90% success rate
            $isSuccess = rand(1, 10) <= 9;

            if ($isSuccess) {
                // Successful payment
                $transactionId = 'txn_' . uniqid();
                $paymentDetails = [
                    'gateway' => 'demo_gateway',
                    'transaction_id' => $transactionId,
                    'payment_method' => $payment->payment_method,
                    'processed_at' => now()->toISOString(),
                ];

                $payment->markAsCompleted($transactionId, $paymentDetails);

                // Create notifications
                $this->createPaymentNotifications($payment);

            } else {
                // Failed payment
                $paymentDetails = [
                    'gateway' => 'demo_gateway',
                    'error' => 'Insufficient funds',
                    'failed_at' => now()->toISOString(),
                ];

                $payment->markAsFailed($paymentDetails);

                throw new \Exception('Payment failed: Insufficient funds');
            }

            return $payment;
        });
    }

    public function processRefund(Payment $payment)
    {
        return DB::transaction(function () use ($payment) {
            // Simulate refund processing
            sleep(1);

            $payment->markAsRefunded();

            // Create refund notification
            Notification::create([
                'user_id' => $payment->patient_id,
                'title' => 'Payment Refunded',
                'message' => "Your payment of {$payment->formatted_amount} has been refunded successfully.",
                'type' => 'success',
                'related_appointment_id' => $payment->appointment_id,
            ]);

            return $payment;
        });
    }

    private function createPaymentNotifications(Payment $payment)
    {
        // Notification for patient
        Notification::create([
            'user_id' => $payment->patient_id,
            'title' => 'Payment Successful',
            'message' => "Your payment of {$payment->formatted_amount} for appointment has been processed successfully.",
            'type' => 'success',
            'related_appointment_id' => $payment->appointment_id,
        ]);

        // Notification for doctor
        $doctorUserId = $payment->appointment->doctor->user_id;
        Notification::create([
            'user_id' => $doctorUserId,
            'title' => 'New Paid Appointment',
            'message' => "You have a new paid appointment. Payment of {$payment->formatted_amount} received.",
            'type' => 'info',
            'related_appointment_id' => $payment->appointment_id,
        ]);
    }

    public function getPaymentStats($patientId = null)
    {
        $query = Payment::query();

        if ($patientId) {
            $query->where('patient_id', $patientId);
        }

        return [
            'total_payments' => $query->count(),
            'total_revenue' => $query->where('status', 'completed')->sum('amount'),
            'successful_payments' => $query->where('status', 'completed')->count(),
            'failed_payments' => $query->where('status', 'failed')->count(),
            'pending_payments' => $query->where('status', 'pending')->count(),
        ];
    }
}
