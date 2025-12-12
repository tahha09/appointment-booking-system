<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Appointment;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run()
    {
        // Get all appointments that should have payments (not cancelled)
        $appointments = Appointment::whereNotIn('status', ['cancelled'])->get();

        $paymentMethods = ['credit_card', 'cash']; // Only these two methods

        foreach ($appointments as $appointment) {
            // Determine payment status based on appointment status and date
            $appointmentDate = strtotime($appointment->appointment_date);
            $today = strtotime(now()->format('Y-m-d'));

            if ($appointment->status === 'completed') {
                // Completed appointments should have completed payments
                $paymentStatus = 'completed';
            } elseif ($appointment->status === 'confirmed') {
                if ($appointmentDate < $today) {
                    // Past confirmed appointments should be completed
                    $paymentStatus = 'completed';
                } else {
                    // Future confirmed appointments may be completed or pending
                    $paymentStatus = rand(1, 10) <= 8 ? 'completed' : 'pending';
                }
            } elseif ($appointment->status === 'pending') {
                // Pending appointments have pending or failed payments
                $paymentStatus = rand(1, 10) <= 7 ? 'pending' : 'failed';
            } else {
                continue; // Skip cancelled appointments
            }

            // Use EGP for most payments
            $currency = rand(1, 4) == 1 ? '$' : 'EGP'; // 25% in USD

            // Convert fee to EGP if needed
            $amount = $appointment->doctor->consultation_fee;
            if ($currency === 'EGP') {
                $amount = $amount * 30; // Approximate conversion rate
            }

            $paymentData = [
                'appointment_id' => $appointment->id,
                'patient_id' => $appointment->patient_id,
                'amount' => round($amount, 2),
                'currency' => $currency,
                'payment_method' => $paymentMethods[array_rand($paymentMethods)],
                'status' => $paymentStatus,
                'transaction_id' => 'TXN' . strtoupper(uniqid()),
                'payment_details' => [
                    'gateway' => 'payment_gateway',
                    'payment_method' => $paymentMethods[array_rand($paymentMethods)],
                    'processed_at' => $this->getProcessedAtDate($appointment, $paymentStatus),
                ],
            ];

            // Only set paid_at if payment is completed
            if ($paymentStatus === 'completed') {
                $paymentData['paid_at'] = $this->getPaidAtDate($appointment);
            }

            Payment::create($paymentData);

            // Update appointment payment status
            $appointment->update([
                'payment_status' => $paymentStatus === 'completed' ? 'paid' : ($paymentStatus === 'failed' ? 'failed' : 'pending'),
                'consultation_fee' => $appointment->doctor->consultation_fee,
            ]);
        }

        $this->command->info('Payments seeded successfully! Created payments for ' . $appointments->count() . ' appointments.');
    }

    private function getProcessedAtDate($appointment, $paymentStatus)
    {
        $appointmentDate = strtotime($appointment->appointment_date);
        $today = strtotime(now()->format('Y-m-d'));

        if ($appointmentDate < $today) {
            // Past appointment - processed before appointment date
            $daysBefore = rand(1, 7);
            return now()->subDays($daysBefore)->toISOString();
        } elseif ($appointmentDate == $today) {
            // Today - processed recently
            $hoursBefore = rand(1, 12);
            return now()->subHours($hoursBefore)->toISOString();
        } else {
            // Future appointment - processed recently
            if ($paymentStatus === 'completed') {
                $daysBefore = rand(0, 5);
                return now()->subDays($daysBefore)->toISOString();
            } else {
                $hoursBefore = rand(1, 24);
                return now()->subHours($hoursBefore)->toISOString();
            }
        }
    }

    private function getPaidAtDate($appointment)
    {
        $appointmentDate = strtotime($appointment->appointment_date);
        $today = strtotime(now()->format('Y-m-d'));

        if ($appointmentDate < $today) {
            // Past appointment - paid 1-7 days before appointment
            $daysBefore = rand(1, 7);
            return now()->subDays($daysBefore + rand(0, 14));
        } elseif ($appointmentDate == $today) {
            // Today - paid 1-6 hours ago
            return now()->subHours(rand(1, 6));
        } else {
            // Future appointment - paid 0-2 days ago
            return now()->subDays(rand(0, 2));
        }
    }
}
