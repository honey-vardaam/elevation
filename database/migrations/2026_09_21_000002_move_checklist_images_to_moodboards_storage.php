<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * The checklists->moodboards rename changed MoodboardController's storage
 * prefix from `checklists/{id}` to `moodboards/{id}`. Any image element
 * saved before the rename still has a `checklists/...` path in its data
 * JSON, which no longer passes the controller's path-prefix guard - move
 * the files and rewrite the stored paths so those images keep working.
 */
return new class extends Migration
{
    public function up(): void
    {
        $disk = Storage::disk('public');

        DB::table('moodboard_elements')
            ->where('type', 'image')
            ->get(['id', 'moodboard_id', 'data'])
            ->each(function (object $row) use ($disk) {
                $data = json_decode($row->data, true) ?? [];
                $path = $data['path'] ?? null;

                if ($path === null || ! Str::startsWith($path, 'checklists/')) {
                    return;
                }

                $newPath = 'moodboards/'.Str::after($path, 'checklists/');

                if ($disk->exists($path) && ! $disk->exists($newPath)) {
                    $disk->move($path, $newPath);
                }

                DB::table('moodboard_elements')
                    ->where('id', $row->id)
                    ->update(['data' => json_encode([...$data, 'path' => $newPath])]);
            });
    }

    public function down(): void
    {
        // One-off data fixup for the checklists -> moodboards rename; not reversible.
    }
};
