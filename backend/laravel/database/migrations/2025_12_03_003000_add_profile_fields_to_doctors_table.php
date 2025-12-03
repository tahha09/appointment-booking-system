<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('doctors', function (Blueprint $table) {
            $table->string('specialty')->nullable()->after('license_number');
            $table->text('qualifications')->nullable()->after('specialty');
            $table->text('bio')->nullable()->after('qualifications');
            $table->text('availability')->nullable()->after('bio');
            $table->string('department')->nullable()->after('availability');
        });
    }

    public function down()
    {
        Schema::table('doctors', function (Blueprint $table) {
            $table->dropColumn(['specialty', 'qualifications', 'bio', 'availability', 'department']);
        });
    }
};
