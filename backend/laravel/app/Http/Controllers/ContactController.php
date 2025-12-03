<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;


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

        return response()->json(['success' => 'Message sent successfully ']);
    }
}
