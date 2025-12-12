<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE payments
            MODIFY payment_method ENUM('credit_card','online_wallet','bank_transfer','cash','refunded_balance') DEFAULT 'credit_card'
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE payments
            MODIFY payment_method ENUM('credit_card','online_wallet','bank_transfer','cash') DEFAULT 'credit_card'
        ");
    }
};
