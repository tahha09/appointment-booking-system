<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('payments')) {
            return;
        }

        $this->dropForeignKey('payments', 'payments_appointment_id_foreign');
        $this->dropForeignKey('payments', 'payments_patient_id_foreign');

        DB::statement('ALTER TABLE payments MODIFY appointment_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE payments MODIFY patient_id BIGINT UNSIGNED NULL');
        DB::statement("ALTER TABLE payments MODIFY currency VARCHAR(3) NOT NULL DEFAULT 'USD'");

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
        if (!Schema::hasTable('payments')) {
            return;
        }

        $this->dropForeignKey('payments', 'payments_appointment_id_foreign');
        $this->dropForeignKey('payments', 'payments_patient_id_foreign');

        DB::statement("ALTER TABLE payments MODIFY currency VARCHAR(255) NOT NULL DEFAULT '$'");
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

    private function dropForeignKey(string $table, string $key): void
    {
        try {
            DB::statement("ALTER TABLE {$table} DROP FOREIGN KEY {$key}");
        } catch (\Throwable $e) {
            // Ignore missing keys
        }
    }
};
