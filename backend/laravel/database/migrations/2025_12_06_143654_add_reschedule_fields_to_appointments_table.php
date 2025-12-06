<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            
            // 1. Date and time of the reschedule
            $table->timestamp('rescheduled_at')->nullable()->after('updated_at');

            // 2. Details of the original appointment before the change
            $table->date('original_appointment_date')->nullable()->after('rescheduled_at');
            $table->time('original_start_time')->nullable()->after('original_appointment_date');
            $table->time('original_end_time')->nullable()->after('original_start_time');

            // 3. Reason for rescheduling (optional)
            $table->text('reschedule_reason')->nullable()->after('original_end_time');

            // 4. Number of reschedules (maximum 3)
            $table->integer('reschedule_count')->default(0)->after('reschedule_reason');

            // 5. Adding indexes to speed up search
            $table->index(['status', 'appointment_date']);
            $table->index(['doctor_id', 'appointment_date', 'status']);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // If we perform a rollback, delete the new fields
            $table->dropColumn([
                'rescheduled_at',
                'original_appointment_date',
                'original_start_time',
                'original_end_time',
                'reschedule_reason',
                'reschedule_count'
            ]);

            $table->dropIndex(['status', 'appointment_date']);
            $table->dropIndex(['doctor_id', 'appointment_date', 'status']);

        });
    }
};
