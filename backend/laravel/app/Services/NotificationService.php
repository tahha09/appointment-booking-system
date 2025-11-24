<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public function createNotification($userId, $title, $message, $type = 'info', $relatedAppointmentId = null)
    {
        return Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'is_read' => false,
            'related_appointment_id' => $relatedAppointmentId,
        ]);
    }

    public function getUserNotifications($userId, $unreadOnly = false)
    {
        $query = Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc');

        if ($unreadOnly) {
            $query->where('is_read', false);
        }

        return $query->get();
    }

    public function markAsRead($notificationId)
    {
        $notification = Notification::findOrFail($notificationId);
        $notification->is_read = true;
        $notification->save();

        return $notification;
    }

    public function markAllAsRead($userId)
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }
}
