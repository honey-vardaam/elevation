<?php

use App\Models\DefaultFolderTemplate;
use App\Models\Project;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('default_folder_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        foreach (Project::DEFAULT_FOLDER_NAMES as $index => $name) {
            DefaultFolderTemplate::create(['name' => $name, 'sort_order' => $index]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('default_folder_templates');
    }
};
