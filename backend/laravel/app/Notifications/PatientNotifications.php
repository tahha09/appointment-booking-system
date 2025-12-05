<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\AllNotification;

class PatientNotifications extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public string $status, public array $data = [])
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
        $subject = $this->getTitle();
        $message = $this->getMessage();

        return (new MailMessage)
            ->subject($subject)
            ->greeting("Hello {$notifiable->name},")
            ->line($message)
            ->line('Thank you for using our platform!');
    }

     public function toDatabase($notifiable)
    {
        return [
            'title' => $this->getTitle(),
            'message' => $this->getMessage(),
            'type' => 'appointment_status',
            'related_appointment_id' => $this->data['appointment_id'] ?? null,
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
            'user_id' => $notifiable->id,
            'title' => $this->getTitle(),
            'message' => $this->getMessage(),
            'type' => 'appointment_status',
            'related_appointment_id' => $this->data['appointment_id'] ?? null,
            'is_read' => false,
        ];
    }

    private function getTitle(): string
    {
        return match ($this->status) {
            'confirmed' => 'Your appointment is confirmed',
            'cancelled' => 'Your appointment is cancelled',
            'completed' => 'Your appointment is completed',
            default => 'Appointment update',
        };
    }

    private function getMessage(): string
    {
        $date = $this->data['appointment_date'] ?? '';
        return match ($this->status) {
            'confirmed' => "Your appointment on {$date} has been accepted.",
            'cancelled' => "Your appointment on {$date} has been cancelled.",
            'completed' => "Your appointment on {$date} has been completed.",
            default => "Your appointment status has changed.",
        };
    }
}
