<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->string('blood_type')->nullable()->after('medical_history');
            $table->text('allergies')->nullable()->after('blood_type');
            $table->text('chronic_conditions')->nullable()->after('allergies');
        });
    }

    public function down()
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn(['blood_type', 'allergies', 'chronic_conditions']);
        });
    }
};

