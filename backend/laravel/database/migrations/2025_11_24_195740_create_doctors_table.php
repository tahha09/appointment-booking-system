<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('specialization_id')->constrained()->onDelete('cascade');
            $table->string('license_number')->unique();
            $table->integer('experience_years')->default(0);
            $table->decimal('consultation_fee', 8, 2)->default(0);
            $table->text('biography')->nullable();
            $table->decimal('rating', 3, 2)->default(0);
            $table->boolean('is_approved')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('doctors');
    }
};
