<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\DoctorController as AdminDoctorController;
use App\Http\Controllers\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Doctor\AppointmentController as DoctorAppointmentController;
use App\Http\Controllers\Doctor\ScheduleController;
use App\Http\Controllers\Doctor\PatientController as DoctorPatientController;
use App\Http\Controllers\Doctor\OverviewController;
use App\Http\Controllers\Doctor\CertificateController;
use App\Http\Controllers\Patient\AppointmentController as PatientAppointmentController;
use App\Http\Controllers\Patient\DoctorController as PatientDoctorController;
use App\Http\Controllers\Patient\ProfileController as PatientProfileController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AI\RecommendationController;
use App\Http\Controllers\Payment\PaymentController;
use App\Http\Controllers\Patient\SpecializationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/
Route::get('doctor/overview/patient-counts', [OverviewController::class, 'patientCounts']);


// Public Routes
Route::post('/login', [LoginController::class, 'login']);
Route::post('/register', [RegisterController::class, 'register']);

Route::get('/doctors', [PatientDoctorController::class, 'indexPublic']);
Route::get('/doctors/top-rated', [PatientDoctorController::class, 'topRated']);
Route::get('/doctors/{id}', [PatientDoctorController::class, 'showPublic']);
Route::get('/doctors/{id}/availability', [PatientDoctorController::class, 'availabilityPublic']);

Route::get('/specializations', [SpecializationController::class, 'index']);
Route::get('/specializations/filter-list', [SpecializationController::class, 'filterList']);
Route::get('/specializations/{id}', [SpecializationController::class, 'show']);

// Test route
Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working!',
        'timestamp' => now()
    ]);
});

// Test route outside doctor group
Route::get('/doctor-test', [OverviewController::class, 'test']);

// Admin Routes - temporarily without authentication for testing
Route::prefix('admin')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Doctor Management
    Route::get('/doctors/pending', [AdminDoctorController::class, 'pendingDoctors']);
    Route::put('/doctors/{id}/approve', [AdminDoctorController::class, 'approveDoctor']);
    Route::put('/doctors/{id}/reject', [AdminDoctorController::class, 'rejectDoctor']);

    // Appointment Management
    Route::get('/appointments', [AdminAppointmentController::class, 'index']);
    Route::get('/appointments/{id}', [AdminAppointmentController::class, 'show']);
    Route::put('/appointments/{id}/status', [AdminAppointmentController::class, 'updateStatus']);

    // Reports
    Route::get('/reports/appointments', [AdminAppointmentController::class, 'appointmentReport']);
    Route::get('/reports/doctors', [AdminDoctorController::class, 'doctorReport']);
});

// Protected Routes - require authentication
Route::middleware(['auth:sanctum'])->group(function () {

    // User profile
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [LoginController::class, 'logout']);

    // General Profile Routes
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/password', [ProfileController::class, 'updatePassword']);
    Route::delete('/account', [ProfileController::class, 'destroy']);

    // Doctor Routes
    Route::prefix('doctor')->group(function () {
        // Dashboard
        Route::get('/dashboard', [DoctorAppointmentController::class, 'dashboard']);

        // Overview
        Route::get('/overview/patient-counts', [OverviewController::class, 'patientCounts']);

        // Appointments
        Route::get('/appointments', [DoctorAppointmentController::class, 'index']);
        Route::get('/appointments/{id}', [DoctorAppointmentController::class, 'show']);
        Route::put('/appointments/{id}/status', [DoctorAppointmentController::class, 'updateStatus']);
        Route::post('/appointments/{id}/medical-notes', [DoctorAppointmentController::class, 'addMedicalNotes']);

        // Schedule Management
        Route::get('/schedule', [ScheduleController::class, 'index']);
        Route::post('/schedule', [ScheduleController::class, 'store']);
        Route::put('/schedule/{id}', [ScheduleController::class, 'update']);
        Route::delete('/schedule/{id}', [ScheduleController::class, 'destroy']);

        // Holidays
        Route::post('/holidays', [ScheduleController::class, 'addHoliday']);
        Route::delete('/holidays/{id}', [ScheduleController::class, 'removeHoliday']);

        // Patients
        Route::get('/patients', [DoctorPatientController::class, 'index']);
        Route::get('/patients/{id}', [DoctorPatientController::class, 'show']);
        Route::get('/patients/{id}/appointments', [DoctorPatientController::class, 'patientAppointments']);
        Route::post('/patients/{id}/block', [DoctorPatientController::class, 'block']);
        Route::post('/patients/{id}/unblock', [DoctorPatientController::class, 'unblock']);

        // Certificates
        Route::get('/certificates', [CertificateController::class, 'index']);
        Route::post('/certificates', [CertificateController::class, 'store']);
        Route::get('/certificates/{id}', [CertificateController::class, 'show']);
        Route::put('/certificates/{id}', [CertificateController::class, 'update']);
        Route::delete('/certificates/{id}', [CertificateController::class, 'destroy']);
    });

    // Patient Routes
    Route::prefix('patient')->middleware('role:patient')->group(function () {
        // Dashboard
        Route::get('/dashboard', [PatientAppointmentController::class, 'dashboard']);

        // Profile
        Route::get('/profile', [PatientProfileController::class, 'show']);
        Route::put('/profile', [PatientProfileController::class, 'update']);
        Route::delete('/account', [PatientProfileController::class, 'destroy']);

        // Doctor Search & Listing
        Route::get('/doctors', [PatientDoctorController::class, 'index']);
        Route::get('/doctors/{id}', [PatientDoctorController::class, 'show']);
        Route::get('/doctors/{id}/availability', [PatientDoctorController::class, 'availability']);

        // Appointments
        Route::get('/appointments', [PatientAppointmentController::class, 'index']);
        Route::get('/appointments/{id}', [PatientAppointmentController::class, 'show']);
        Route::post('/appointments', [PatientAppointmentController::class, 'store']);
        Route::put('/appointments/{id}/cancel', [PatientAppointmentController::class, 'cancel']);
        Route::put('/appointments/{id}/reschedule', [PatientAppointmentController::class, 'reschedule']);

        // Medical Records
        Route::get('/medical-records', [PatientAppointmentController::class, 'medicalRecords']);
        Route::get('/medical-records/{id}', [PatientAppointmentController::class, 'medicalRecord']);

        // Medical History
        Route::get('/medical-history', [\App\Http\Controllers\Patient\MedicalHistoryController::class, 'index']);
    });

    // AI Routes (accessible by doctors and patients)
    Route::prefix('ai')->group(function () {
        Route::middleware('role:patient')->post('/doctor-recommendation', [RecommendationController::class, 'recommendDoctors']);
        Route::middleware('role:doctor')->post('/generate-medical-notes', [RecommendationController::class, 'generateMedicalNotes']);
        Route::middleware('role:doctor')->get('/patient-summary/{patientId}', [RecommendationController::class, 'patientSummary']);
    });

    // Shared Routes (accessible by multiple roles)
    Route::prefix('shared')->group(function () {
        // Notifications
        Route::get('/notifications', function (Request $request) {
            return $request->user()->notifications()->orderBy('created_at', 'desc')->get();
        });

        Route::put('/notifications/{id}/read', function (Request $request, $id) {
            $notification = $request->user()->notifications()->findOrFail($id);
            $notification->update(['is_read' => true]);
            return response()->json(['message' => 'Notification marked as read']);
        });

        Route::put('/notifications/read-all', function (Request $request) {
            $request->user()->notifications()->where('is_read', false)->update(['is_read' => true]);
            return response()->json(['message' => 'All notifications marked as read']);
        });

        // Specializations
        Route::get('/specializations', function () {
            return \App\Models\Specialization::all();
        });
    });

    // Payment Routes
    Route::prefix('payments')->middleware(['auth:sanctum', 'role:patient'])->group(function () {
        Route::post('/create-intent', [PaymentController::class, 'createPaymentIntent']);
        Route::post('/confirm', [PaymentController::class, 'confirmPayment']);
        Route::get('/{id}', [PaymentController::class, 'getPayment']);
        Route::get('/', [PaymentController::class, 'getPatientPayments']);
        Route::post('/{id}/refund', [PaymentController::class, 'refundPayment']);
    });
});

// Fallback route for undefined API endpoints
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API endpoint not found'
    ], 404);
});
