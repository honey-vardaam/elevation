<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('phase_activities', function (Blueprint $table) {
            $table->foreignId('reviewer_id')->nullable()->after('parent_id')->constrained('users')->nullOnDelete();
            $table->string('review_status')->nullable()->after('reviewer_id');
        });
    }

    public function down(): void
    {
        Schema::table('phase_activities', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reviewer_id');
            $table->dropColumn('review_status');
        });
    }
};
