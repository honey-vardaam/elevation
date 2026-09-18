<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('checklists', 'moodboards');
        Schema::rename('checklist_elements', 'moodboard_elements');

        Schema::table('moodboard_elements', function (Blueprint $table) {
            $table->renameColumn('checklist_id', 'moodboard_id');
        });
    }

    public function down(): void
    {
        Schema::table('moodboard_elements', function (Blueprint $table) {
            $table->renameColumn('moodboard_id', 'checklist_id');
        });

        Schema::rename('moodboard_elements', 'checklist_elements');
        Schema::rename('moodboards', 'checklists');
    }
};
