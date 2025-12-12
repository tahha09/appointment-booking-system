<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Appointment;
use App\Notifications\AppointmentReminder;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SendAppointmentReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $timeFilter;

    public function __construct($timeFilter = 'today')
    {
        $this->timeFilter = $timeFilter;
    }

    public function handle()
    {
        Log::info("Appointment reminder job started", ['filter' => $this->timeFilter]);

        $appointments = $this->getAppointmentsForReminder($this->timeFilter);

        foreach ($appointments as $appointment) {
            try {
                $patient = $appointment->patient;
                if (!$patient)
                    continue;

                $user = $patient->user;
                if (!$user || !$user->email)
                    continue;

                // Send notification
                $user->notify(new AppointmentReminder($appointment));

                // Mark as reminded
                $appointment->update([
                    'reminder_sent' => true,
                    'reminder_sent_at' => now()
                ]);

                Log::info("Reminder sent", [
                    'appointment_id' => $appointment->id,
                    'patient_email' => $user->email
                ]);

            } catch (\Exception $e) {
                Log::error("Error sending reminder", [
                    'appointment_id' => $appointment->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    private function getAppointmentsForReminder(string $timeFilter)
    {
        $now = Carbon::now();
        $query = Appointment::with(['doctor.user', 'patient.user'])
            ->whereIn('status', ['pending', 'confirmed', 'scheduled'])
            ->where('reminder_sent', false);

        switch ($timeFilter) {
            case 'tomorrow':
                $query->whereDate('appointment_date', $now->addDay()->toDateString());
                break;

            case 'today':
            default:
                $query->whereDate('appointment_date', $now->toDateString());
                break;
        }

        return $query->get();
    }
}
