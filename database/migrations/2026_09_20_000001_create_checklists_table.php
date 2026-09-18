<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checklists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->timestamps();

            $table->index(['user_id', 'project_id']);
        });

        Schema::create('checklist_elements', function (Blueprint $table) {
            // Client-generated UUIDs: the canvas creates elements locally and
            // syncs the whole board, so ids must exist before the server sees them.
            $table->uuid('id')->primary();
            $table->foreignId('checklist_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->float('x');
            $table->float('y');
            $table->float('width')->nullable();
            $table->float('height')->nullable();
            $table->integer('z_index')->default(0);
            $table->json('data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_elements');
        Schema::dropIfExists('checklists');
    }
};
