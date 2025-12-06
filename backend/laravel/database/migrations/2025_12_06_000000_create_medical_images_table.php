<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('medical_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image_type'); // x-ray, ct-scan, mri, ultrasound, lab-result, prescription, other
            $table->json('images')->nullable(); // Store array of image paths
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('medical_images');
    }
};
