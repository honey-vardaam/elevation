<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A phase template becomes a single step ("node") inside a
     * phase_flow_template's canvas. Its one outgoing connection is stored
     * directly on the row (next_phase_template_id); the unique index on
     * that column guarantees at most one incoming connection too, which is
     * what keeps the graph a single linear chain without a separate edges
     * table.
     */
    public function up(): void
    {
        Schema::table('phase_templates', function (Blueprint $table) {
            $table->foreignId('phase_flow_template_id')->nullable()->after('id')
                ->constrained()->cascadeOnDelete();
            $table->foreignId('next_phase_template_id')->nullable()->unique()->after('phase_flow_template_id')
                ->constrained('phase_templates')->nullOnDelete();
            $table->integer('position_x')->default(0)->after('sort_order');
            $table->integer('position_y')->default(0)->after('position_x');
        });
    }

    public function down(): void
    {
        Schema::table('phase_templates', function (Blueprint $table) {
            $table->dropConstrainedForeignId('next_phase_template_id');
            $table->dropConstrainedForeignId('phase_flow_template_id');
            $table->dropColumn(['position_x', 'position_y']);
        });
    }
};
