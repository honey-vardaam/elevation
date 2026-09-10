<?php

namespace App\Http\Requests\Folders;

use App\Concerns\FolderValidationRules;
use App\Models\Folder;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

class UpdateFolderRequest extends FormRequest
{
    use FolderValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('folder'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->folderRules($this->route('project'), $this->route('folder'));
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $parentId = $this->input('parent_id');

            if ($parentId === null) {
                return;
            }

            /** @var Folder $folder */
            $folder = $this->route('folder');

            if ((int) $parentId === $folder->id) {
                $validator->errors()->add('parent_id', 'A folder cannot be moved into itself.');

                return;
            }

            if (in_array((int) $parentId, $this->descendantIds($folder), true)) {
                $validator->errors()->add('parent_id', 'A folder cannot be moved into one of its own subfolders.');
            }
        });
    }

    /**
     * Breadth-first collect every descendant folder id, loading the whole
     * project's folder list once instead of querying per level.
     *
     * @return array<int, int>
     */
    private function descendantIds(Folder $folder): array
    {
        $all = $folder->project->folders()->get(['id', 'parent_id']);

        $descendants = [];
        $queue = [$folder->id];

        while ($queue !== []) {
            $currentId = array_shift($queue);
            $children = $all->where('parent_id', $currentId)->pluck('id')->all();
            $descendants = array_merge($descendants, $children);
            $queue = array_merge($queue, $children);
        }

        return $descendants;
    }
}
