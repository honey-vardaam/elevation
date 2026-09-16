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
            $table->decimal('banner_focal_x', 5, 2)->default(50)->after('banner_path');
            $table->decimal('banner_focal_y', 5, 2)->default(50)->after('banner_focal_x');
            $table->decimal('banner_zoom', 4, 2)->default(1)->after('banner_focal_y');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['banner_focal_x', 'banner_focal_y', 'banner_zoom']);
        });
    }
};
