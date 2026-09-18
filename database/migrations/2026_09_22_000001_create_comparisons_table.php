<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comparisons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('mode')->default('side_by_side');
            $table->foreignId('left_file_id')->nullable()->constrained('project_files')->nullOnDelete();
            $table->foreignId('right_file_id')->nullable()->constrained('project_files')->nullOnDelete();
            $table->timestamps();

            $table->index(['project_id', 'updated_at']);
        });

        Schema::create('comparison_reviewers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comparison_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invited_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->unique(['comparison_id', 'user_id']);
        });

        Schema::create('comparison_annotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comparison_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('comparison_annotations')->cascadeOnDelete();
            $table->string('side')->default('general');
            $table->float('x')->nullable();
            $table->float('y')->nullable();
            $table->text('body');
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['comparison_id', 'parent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comparison_annotations');
        Schema::dropIfExists('comparison_reviewers');
        Schema::dropIfExists('comparisons');
    }
};
