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
        Schema::table('projects', function (Blueprint $table) {
            $table->string('banner_path')->nullable()->after('description');
            $table->string('client_name')->nullable()->after('banner_path');
            $table->string('client_email')->nullable()->after('client_name');
            $table->string('client_phone')->nullable()->after('client_email');
            $table->string('site_address')->nullable()->after('client_phone');
            $table->string('site_area')->nullable()->after('site_address');
            $table->date('start_date')->nullable()->after('site_area');
            $table->date('end_date')->nullable()->after('start_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'banner_path',
                'client_name',
                'client_email',
                'client_phone',
                'site_address',
                'site_area',
                'start_date',
                'end_date',
            ]);
        });
    }
};
