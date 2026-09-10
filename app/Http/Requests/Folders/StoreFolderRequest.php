<?php

namespace App\Http\Requests\Folders;

use App\Concerns\FolderValidationRules;
use App\Models\Folder;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreFolderRequest extends FormRequest
{
    use FolderValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('create', [Folder::class, $this->route('project')]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->folderRules($this->route('project'));
    }
}
