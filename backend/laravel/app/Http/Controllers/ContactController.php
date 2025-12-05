<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Notifications\ContactMessageNotification;


class ContactController extends Controller
{
    //
    public function sendEmail(Request $request)
    {
        // Validate input
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:100',
            'message' => 'required|string',
        ]);

        $data = $request->only('name', 'email', 'message');

        // Send simple email
        Mail::raw(
            "Message from: {$data['name']} ({$data['email']})\n\n{$data['message']}",
            function ($message) use ($data) {
                $message->to('ahmed185taha@gmail.com')
                        ->subject('New Contact Message From ' . $data['name'])
                        ->from($data['email'], $data['name']);
            }
        );

        $admins = User::admins()->get(); // get all admins
    foreach ($admins as $admin) {
        $admin->notify(new ContactMessageNotification([
            'name' => $data['name'],
            'email' => $data['email'],
            'message' => $data['message'],
        ]));
    }

        return response()->json(['success' => 'Message sent successfully ']);
    }
}
