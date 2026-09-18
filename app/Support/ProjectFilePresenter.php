<?php

namespace App\Support;

use App\Models\Folder;
use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Support\Collection;

class ProjectFilePresenter
{
    /**
     * Every file in the project, across every folder, with a human-readable
     * "Grandparent / Parent / Folder" path - used by pickers that need to
     * reference something already in storage (e.g. the phase chat composer's
     * "attach from project files" option) without browsing folder by folder.
     *
     * @param  Collection<int, Folder>|null  $folders  Pass the project's already-fetched
     *                                                  folder tree to avoid a second query.
     * @return array<int, array{id: int, name: string, size: int, mime_type: string|null, folder_path: string|null}>
     */
    public static function forProject(Project $project, ?Collection $folders = null): array
    {
        $folders ??= $project->folders()->get(['id', 'parent_id', 'name']);
        $paths = self::folderPaths($folders);

        return $project->files()
            ->orderBy('name')
            ->get(['id', 'name', 'size', 'mime_type', 'folder_id'])
            ->map(fn (ProjectFile $file) => [
                'id' => $file->id,
                'name' => $file->name,
                'size' => $file->size,
                'mime_type' => $file->mime_type,
                'folder_path' => $paths[$file->folder_id] ?? null,
            ])
            ->all();
    }

    /**
     * @param  Collection<int, Folder>  $folders
     * @return array<int, string>
     */
    private static function folderPaths(Collection $folders): array
    {
        $paths = [];
        $pathFor = function (Folder $folder) use (&$pathFor, &$paths, $folders) {
            if (isset($paths[$folder->id])) {
                return $paths[$folder->id];
            }

            $parent = $folder->parent_id !== null ? $folders->firstWhere('id', $folder->parent_id) : null;

            return $paths[$folder->id] = $parent !== null
                ? $pathFor($parent).' / '.$folder->name
                : $folder->name;
        };

        foreach ($folders as $folder) {
            $pathFor($folder);
        }

        return $paths;
    }
}
