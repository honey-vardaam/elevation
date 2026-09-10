<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Existing values are free text (e.g. "3,200 sq ft") - extract the
        // leading number before the column becomes numeric, so the cast
        // below doesn't silently zero out real data.
        foreach (DB::table('projects')->whereNotNull('site_area')->get(['id', 'site_area']) as $project) {
            preg_match('/[\d,]+(\.\d+)?/', (string) $project->site_area, $matches);
            $numeric = isset($matches[0]) ? (float) str_replace(',', '', $matches[0]) : null;

            DB::table('projects')->where('id', $project->id)->update(['site_area' => $numeric]);
        }

        Schema::table('projects', function (Blueprint $table) {
            $table->decimal('site_area', 10, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('site_area')->nullable()->change();
        });
    }
};
