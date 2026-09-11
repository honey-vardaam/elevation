<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phase_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_phase_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->foreignId('parent_id')->nullable()->constrained('phase_activities')->nullOnDelete();
            $table->text('body')->nullable();
            $table->json('meta')->nullable();
            $table->foreignId('attachment_id')->nullable()->constrained('project_files')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phase_activities');
    }
};
