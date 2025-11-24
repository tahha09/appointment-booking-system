<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;

class UserController extends Controller
{
    use ApiResponse;

    public function __construct()
    {
        // الـ middleware تم تطبيقه في routes، لكن يمكن إضافته هنا أيضاً
        // $this->middleware('role:admin');
    }

    public function index()
    {
        try {
            $users = \App\Models\User::all();
            return $this->success($users, 'Users retrieved successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }
}
