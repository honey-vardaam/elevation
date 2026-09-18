<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Wraps any pre-existing phase_templates rows (the old flat, global
     * pipeline) into one "Default pipeline" flow, chained in their current
     * sort_order - so orgs that already had a pipeline don't lose it, they
     * just see it as their first flow, ready to view/edit on the canvas.
     */
    public function up(): void
    {
        $templateIds = DB::table('phase_templates')->orderBy('sort_order')->pluck('id');

        if ($templateIds->isEmpty()) {
            return;
        }

        $flowId = DB::table('phase_flow_templates')->insertGetId([
            'name' => 'Default pipeline',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($templateIds->values() as $index => $id) {
            DB::table('phase_templates')->where('id', $id)->update([
                'phase_flow_template_id' => $flowId,
                'position_x' => $index * 260,
                'position_y' => 0,
            ]);
        }

        foreach ($templateIds->values() as $index => $id) {
            $nextId = $templateIds->values()->get($index + 1);

            if ($nextId !== null) {
                DB::table('phase_templates')->where('id', $id)->update(['next_phase_template_id' => $nextId]);
            }
        }
    }

    /**
     * Best-effort: un-links and un-flows every step, then removes the
     * backfilled flow. Not fully lossless if steps were edited/reconnected
     * after this migration ran - same caveat as other data-backfilling
     * migrations in this codebase.
     */
    public function down(): void
    {
        $flow = DB::table('phase_flow_templates')->where('name', 'Default pipeline')->first();

        if ($flow === null) {
            return;
        }

        DB::table('phase_templates')
            ->where('phase_flow_template_id', $flow->id)
            ->update(['next_phase_template_id' => null]);

        DB::table('phase_templates')
            ->where('phase_flow_template_id', $flow->id)
            ->update(['phase_flow_template_id' => null]);

        DB::table('phase_flow_templates')->where('id', $flow->id)->delete();
    }
};
