<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\SendAppointmentReminderJob;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Console\Command\Command as SymfonyCommand;

class ScheduleAppointmentReminders extends Command
{
    protected $signature = 'appointment:schedule-reminders';
    protected $description = 'Schedule appointment reminder jobs';

    public function handle(): int
    {
        // Dispatch jobs for different time frames
        SendAppointmentReminderJob::dispatch('today');
        SendAppointmentReminderJob::dispatch('tomorrow');

        $this->info('Appointment reminder jobs have been dispatched.');
        Log::info('Appointment reminder jobs dispatched');

        return SymfonyCommand::SUCCESS;
    }
}
