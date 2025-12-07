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
        Schema::table('specializations', function (Blueprint $table) {
            $table->text('common_conditions')->nullable();
            $table->text('procedures')->nullable();
            $table->text('when_to_see')->nullable();
            $table->text('emergency_signs')->nullable();
            $table->text('preparation_tips')->nullable();
            $table->integer('typical_duration')->nullable(); // minutes
            $table->decimal('avg_cost', 8, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('specializations', function (Blueprint $table) {
            $table->dropColumn([
                'common_conditions',
                'procedures',
                'when_to_see',
                'emergency_signs',
                'preparation_tips',
                'typical_duration',
                'avg_cost'
            ]);
        });
    }
};
