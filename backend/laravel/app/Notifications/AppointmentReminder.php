<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public $appointment;

    public function __construct($appointment)
    {
        $this->appointment = $appointment;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    protected function doctorName()
    {
        return optional(optional($this->appointment->doctor)->user)->name ?: 'Unknown Doctor';
    }

    public function toMail($notifiable)
    {
        $doctorName = $this->doctorName();

        return (new MailMessage)
            ->subject('Appointment Reminder - Today')
            ->greeting("Hello {$notifiable->name}!")
            ->line("This is a reminder for your appointment today:")
            ->line("Doctor: Dr. {$doctorName}")
            ->line("Date: {$this->appointment->appointment_date->format('F j, Y')}")
            ->line("Time: {$this->appointment->start_time}")
            ->line("Status: {$this->appointment->status}")
            ->action('View Appointment Details', url('/patient/appointments/' . $this->appointment->id))
            ->line('Please arrive 15 minutes before your appointment time.')
            ->line('If you need to reschedule or cancel, please do so at least 24 hours in advance.');
    }

    public function toArray($notifiable)
    {
        $doctorName = $this->doctorName();

        return [
            'appointment_id' => $this->appointment->id,
            'message' => "Reminder: Appointment with Dr. {$doctorName} today at {$this->appointment->start_time}",
            'type' => 'appointment_reminder',
            'appointment_date' => $this->appointment->appointment_date->format('Y-m-d'),
            'start_time' => $this->appointment->start_time,
            'status' => $this->appointment->status,
            'doctor_name' => $doctorName,
        ];
    }
}
