<?php

namespace App\Http\Requests\Files;

use App\Models\ProjectFile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', [ProjectFile::class, $this->route('project')]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 100MB - large architectural drawings/renders. If uploads this
            // size fail in practice, php.ini's upload_max_filesize and
            // post_max_size also need raising; this rule alone isn't enough.
            'file' => ['required', 'file', 'max:102400'],
            'folder_id' => [
                'nullable',
                'integer',
                Rule::exists('folders', 'id')->where('project_id', $this->route('project')->id),
            ],
        ];
    }
}
