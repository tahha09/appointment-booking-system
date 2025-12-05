<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['appointment_id']);
            $table->dropForeign(['patient_id']);
        });

        DB::statement('ALTER TABLE payments MODIFY appointment_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE payments MODIFY patient_id BIGINT UNSIGNED NULL');

        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('appointment_id')
                ->references('id')
                ->on('appointments')
                ->nullOnDelete();
            $table->foreign('patient_id')
                ->references('id')
                ->on('patients')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['appointment_id']);
            $table->dropForeign(['patient_id']);
        });

        DB::statement('ALTER TABLE payments MODIFY appointment_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE payments MODIFY patient_id BIGINT UNSIGNED NOT NULL');

        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('appointment_id')
                ->references('id')
                ->on('appointments')
                ->nullOnDelete();
            $table->foreign('patient_id')
                ->references('id')
                ->on('patients')
                ->nullOnDelete();
        });
    }
};
