<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('blocked_patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained()->onDelete('cascade');
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->text('reason')->nullable();
            $table->timestamps();
            
            $table->unique(['doctor_id', 'patient_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('blocked_patients');
    }
};

