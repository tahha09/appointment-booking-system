<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\AllNotification;

class DoctorNotifications extends Notification implements ShouldQueue
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
        $subject = $this->data['subject'] ?? 'Notification';
        $message = $this->data['message'] ?? 'You have a new notification.';

        return (new MailMessage)
            ->subject($subject)
            ->greeting("Hello {$notifiable->name},")
            ->line($message)
            ->line('Thank you for using our platform!');
    }

    public function toDatabase($notifiable)
    {
        return [
        'title' => $this->data['title'] ?? 'Notification',
        'message' => $this->data['message'] ?? '',
        'type' => $this->data['type'] ?? 'info',
        'related_appointment_id' => $this->data['related_appointment_id'] ?? null,
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
            'title' => $this->data['title'] ?? 'Notification',
            'message' => $this->data['message'] ?? '',
            'type' => $this->data['type'] ?? 'info',
            'related_appointment_id' => $this->data['related_appointment_id'] ?? null,
            'is_read' => false,
        ];
    }
}
