<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained()->onDelete('cascade');
            $table->date('holiday_date');
            $table->string('reason');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('holidays');
    }
};
