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

        $paymentMethods = ['credit_card', 'online_wallet', 'bank_transfer', 'cash'];
        $currencies = ['$', 'EGP'];

        foreach ($appointments as $index => $appointment) {
            // Determine payment status based on appointment status and date
            $appointmentDate = strtotime($appointment->appointment_date);
            $today = strtotime(now()->format('Y-m-d'));

            if ($appointment->status === 'completed') {
                // Completed appointments should have completed or failed payments
                $paymentStatus = (rand(1, 10) <= 9) ? 'completed' : 'failed'; // 90% success rate
            } elseif ($appointment->status === 'confirmed') {
                if ($appointmentDate < $today) {
                    // Past confirmed appointments should be completed
                    $paymentStatus = (rand(1, 10) <= 8) ? 'completed' : 'failed'; // 80% success rate
                } else {
                    // Future confirmed appointments may be pending or completed
                    $paymentStatus = (rand(1, 10) <= 7) ? 'completed' : 'pending'; // 70% completed, 30% pending
                }
            } elseif ($appointment->status === 'pending') {
                // Pending appointments have pending or failed payments
                $paymentStatus = (rand(1, 10) <= 6) ? 'pending' : 'failed'; // 60% pending, 40% failed
            } else {
                continue; // Skip cancelled appointments
            }

            // Use EGP for most payments, $ for some
            $currency = ($index % 4 == 0) ? '$' : 'EGP'; // 25% in USD

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

    /**
     * Get appropriate processed_at date for payment details
     */
    private function getProcessedAtDate($appointment, $paymentStatus)
    {
        $appointmentDate = strtotime($appointment->appointment_date);
        $today = strtotime(now()->format('Y-m-d'));

        if ($appointmentDate < $today) {
            // Past appointment - processed before appointment date
            return now()->subDays(rand(1, 14))->toISOString();
        } elseif ($appointmentDate == $today) {
            // Today - processed recently
            return now()->subHours(rand(1, 24))->toISOString();
        } else {
            // Future appointment - processed recently or scheduled
            if ($paymentStatus === 'completed') {
                return now()->subDays(rand(0, 3))->toISOString();
            } else {
                return now()->subHours(rand(1, 12))->toISOString();
            }
        }
    }

    /**
     * Get appropriate paid_at date for completed payments
     */
    private function getPaidAtDate($appointment)
    {
        $appointmentDate = strtotime($appointment->appointment_date);
        $today = strtotime(now()->format('Y-m-d'));

        if ($appointmentDate < $today) {
            // Past appointment - paid around appointment time
            $appointmentDateTime = strtotime($appointment->appointment_date . ' ' . $appointment->start_time);
            $paidTime = $appointmentDateTime - rand(3600, 86400); // 1-24 hours before appointment
            return date('Y-m-d H:i:s', max($paidTime, strtotime('2024-01-01'))); // Ensure not before 2024
        } elseif ($appointmentDate == $today) {
            // Today - paid recently
            return now()->subHours(rand(1, 6));
        } else {
            // Future appointment - paid recently
            return now()->subDays(rand(0, 2));
        }
    }
}
