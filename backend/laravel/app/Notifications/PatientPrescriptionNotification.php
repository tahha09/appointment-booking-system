<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\AllNotification;

class PatientPrescriptionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public string $type, public array $data = [])
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $subject = $this->data['subject'] ?? 'New medical prescription';
        $message = $this->data['message'] ?? 'You have a new medical prescription';
        $doctorName = $this->data['doctor_name'] ?? 'The doctor';
        $medication = $this->data['medication_name'] ?? 'The prescribed medication';

        return (new MailMessage)
            ->subject($subject)
            ->greeting("Hello {$notifiable->name},")
            ->line($message)
            ->line("Doctor: {$doctorName}")
            ->line("Medication: {$medication}")
            ->line("You can view the prescription details through your account on the platform.")
            ->action('View Prescription', url('/patient/prescriptions'))
            ->line('We wish you a speedy recovery!');

    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => $this->data['title'] ?? 'New Medical Prescription',
            'message' => $this->data['message'] ?? '',
            'type' => $this->data['type'] ?? 'info',
            'prescription_id' => $this->data['prescription_id'] ?? null,
            'doctor_name' => $this->data['doctor_name'] ?? null,
            'specialization' => $this->data['specialization'] ?? null,
            'medication_name' => $this->data['medication_name'] ?? null,
            'is_read' => false,
        ];
    }


    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
            'user_id' => $notifiable->id,
            'title' => $this->data['title'] ?? 'New Medical Prescription',
            'message' => $this->data['message'] ?? '',
            'type' => $this->data['type'] ?? 'info',
            'prescription_id' => $this->data['prescription_id'] ?? null,
            'doctor_name' => $this->data['doctor_name'] ?? null,
            'specialization' => $this->data['specialization'] ?? null,
            'medication_name' => $this->data['medication_name'] ?? null,
            'is_read' => false,

        ];
    }
}
