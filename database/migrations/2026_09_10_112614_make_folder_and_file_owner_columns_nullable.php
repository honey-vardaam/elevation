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
        Schema::table('folders', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });

        Schema::table('folders', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->change();
        });

        Schema::table('folders', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('project_files', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
        });

        Schema::table('project_files', function (Blueprint $table) {
            $table->foreignId('uploaded_by')->nullable()->change();
        });

        Schema::table('project_files', function (Blueprint $table) {
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('folders', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });

        Schema::table('folders', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable(false)->change();
        });

        Schema::table('folders', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('project_files', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
        });

        Schema::table('project_files', function (Blueprint $table) {
            $table->foreignId('uploaded_by')->nullable(false)->change();
        });

        Schema::table('project_files', function (Blueprint $table) {
            $table->foreign('uploaded_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
