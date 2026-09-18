<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Merges the "review" activity type into "change_request": a request
     * now optionally carries a reviewer instead of being a separate type,
     * so `review_status` (pending/changes_requested/approved) becomes the
     * more general `activity_status` (open/changes_requested/resolved).
     */
    public function up(): void
    {
        Schema::table('phase_activities', function (Blueprint $table) {
            $table->renameColumn('review_status', 'activity_status');
        });

        DB::table('phase_activities')
            ->where('type', 'change_request')
            ->update([
                'activity_status' => DB::raw("(CASE WHEN resolved_at IS NULL THEN 'open' ELSE 'resolved' END)"),
            ]);

        DB::table('phase_activities')
            ->where('type', 'review')
            ->where('activity_status', 'pending')
            ->update(['activity_status' => 'open']);

        DB::table('phase_activities')
            ->where('type', 'review')
            ->where('activity_status', 'approved')
            ->update(['activity_status' => 'resolved']);

        DB::table('phase_activities')
            ->where('type', 'review')
            ->update(['type' => 'change_request']);
    }

    public function down(): void
    {
        // Best-effort reverse mapping: a request that still has a reviewer
        // assigned goes back to being type "review"; the rest stay
        // "change_request". Not fully lossless (e.g. a resolved request
        // with a reviewer can't be told apart from a reviewer-approved one
        // that was later reopened and closed manually).
        DB::table('phase_activities')
            ->whereNotNull('reviewer_id')
            ->update(['type' => 'review']);

        DB::table('phase_activities')
            ->where('type', 'review')
            ->where('activity_status', 'open')
            ->update(['activity_status' => 'pending']);

        DB::table('phase_activities')
            ->where('type', 'review')
            ->where('activity_status', 'resolved')
            ->update(['activity_status' => 'approved']);

        Schema::table('phase_activities', function (Blueprint $table) {
            $table->renameColumn('activity_status', 'review_status');
        });
    }
};
