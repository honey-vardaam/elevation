<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_files', function (Blueprint $table) {
            $table->foreignId('phase_activity_id')->nullable()->after('uploaded_by')->constrained('phase_activities')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('project_files', function (Blueprint $table) {
            $table->dropConstrainedForeignId('phase_activity_id');
        });
    }
};
