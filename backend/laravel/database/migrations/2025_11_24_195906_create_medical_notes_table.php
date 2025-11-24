<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('medical_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->onDelete('cascade');
            $table->text('symptoms')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('prescription')->nullable();
            $table->text('follow_up_notes')->nullable();
            $table->text('ai_generated_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('medical_notes');
    }
};
