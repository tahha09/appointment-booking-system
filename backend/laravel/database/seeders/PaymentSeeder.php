<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Appointment;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run()
    {
        // Get confirmed appointments
        $appointments = Appointment::where('status', 'confirmed')->get();

        foreach ($appointments as $appointment) {
            // Create payment for each appointment
            Payment::create([
                'appointment_id' => $appointment->id,
                'patient_id' => $appointment->patient_id,
                'amount' => $appointment->doctor->consultation_fee,
                'currency' => 'USD',
                'payment_method' => 'card',
                'status' => 'completed',
                'transaction_id' => 'txn_' . uniqid(),
                'payment_details' => [
                    'gateway' => 'demo_gateway',
                    'payment_method' => 'card',
                    'processed_at' => now()->toISOString(),
                ],
                'paid_at' => now(),
            ]);

            // Update appointment payment status
            $appointment->update([
                'payment_status' => 'paid',
                'consultation_fee' => $appointment->doctor->consultation_fee,
            ]);
        }

        $this->command->info('Payments seeded successfully!');
    }
}
