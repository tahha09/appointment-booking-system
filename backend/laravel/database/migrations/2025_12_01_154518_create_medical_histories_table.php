<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('patient_id');

            $table->text('chronic_diseases')->nullable();    // e.g. Diabetes, HTN
            $table->text('allergies')->nullable();
            $table->text('surgeries')->nullable();
            $table->text('medications')->nullable();
            $table->text('family_history')->nullable();
            $table->text('social_history')->nullable();      // smoking, alcohol, etc.
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->foreign('patient_id')
                ->references('id')->on('patients')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_histories');
    }
};
