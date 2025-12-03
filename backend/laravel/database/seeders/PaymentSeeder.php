<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Appointment;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run()
    {
        // Get confirmed and completed appointments
        $appointments = Appointment::whereIn('status', ['confirmed', 'completed'])->get();

        $paymentMethods = ['card', 'cash', 'bank_transfer', 'online'];
        $currencies = ['USD', 'EGP'];
        $statuses = ['completed', 'pending', 'failed'];

        foreach ($appointments as $index => $appointment) {
            // Most payments are completed, some pending, few failed
            if ($index % 10 == 0) {
                $paymentStatus = 'failed';
            } elseif ($index % 8 == 0) {
                $paymentStatus = 'pending';
            } else {
                $paymentStatus = 'completed';
            }

            // Use EGP for most payments, USD for some
            $currency = ($index % 3 == 0) ? 'USD' : 'EGP';

            // Convert fee to EGP if needed (approximate conversion)
            $amount = $appointment->doctor->consultation_fee;
            if ($currency === 'EGP') {
                $amount = $amount * 30; // Approximate conversion rate
            }

            $paymentData = [
                'appointment_id' => $appointment->id,
                'patient_id' => $appointment->patient_id,
                'amount' => $amount,
                'currency' => $currency,
                'payment_method' => $paymentMethods[$index % count($paymentMethods)],
                'status' => $paymentStatus,
                'transaction_id' => 'txn_' . strtoupper(uniqid()),
                'payment_details' => [
                    'gateway' => 'demo_gateway',
                    'payment_method' => $paymentMethods[$index % count($paymentMethods)],
                    'processed_at' => now()->subDays(rand(0, 7))->toISOString(),
                ],
            ];

            // Only set paid_at if payment is completed
            if ($paymentStatus === 'completed') {
                $paymentData['paid_at'] = now()->subDays(rand(0, 7));
            }

            Payment::create($paymentData);

            // Update appointment payment status only if payment is completed
            if ($paymentStatus === 'completed') {
                $appointment->update([
                    'payment_status' => 'paid',
                    'consultation_fee' => $appointment->doctor->consultation_fee,
                ]);
            } elseif ($paymentStatus === 'failed') {
                $appointment->update([
                    'payment_status' => 'failed',
                    'consultation_fee' => $appointment->doctor->consultation_fee,
                ]);
            } else {
                $appointment->update([
                    'payment_status' => 'pending',
                    'consultation_fee' => $appointment->doctor->consultation_fee,
                ]);
            }
        }

        $this->command->info('Payments seeded successfully!');
    }
}
