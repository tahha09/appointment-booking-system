<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\AllNotification;

class ContactMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public array $data)
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
         $subject = $this->data['subject'] ?? 'New Contact Message';
        $message = $this->data['message'] ?? 'You have a new message.';

        return (new MailMessage)
            ->subject($subject)
            ->greeting("Hello {$notifiable->name},")
            ->line("You received a new contact message.")
            ->line("Name: {$this->data['name']}")
            ->line("Email: {$this->data['email']}")
            ->line("Message: {$this->data['message']}")
            ->line('Thank you for using our platform!');
    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => 'New Contact Message',
            'message' => "Message from {$this->data['name']} ({$this->data['email']}): {$this->data['message']}",
            'type' => 'contact',
            'sender_email' => $this->data['email'],
            'sender_name' => $this->data['name'],
        ];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
