<?php

namespace App\Concerns;

use App\Models\Folder;
use App\Models\Project;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait FolderValidationRules
{
    /**
     * Get the validation rules used to validate folders.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function folderRules(Project $project, ?Folder $folder = null): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('folders', 'name')
                    ->where(fn ($query) => $query
                        ->where('project_id', $project->id)
                        ->where('parent_id', $this->input('parent_id'))
                    )
                    ->ignore($folder?->id),
            ],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('folders', 'id')->where('project_id', $project->id),
            ],
        ];
    }
}
