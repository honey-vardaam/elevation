<?php

namespace App\Http\Requests\DefaultFolderTemplates;

use App\Concerns\DefaultFolderTemplateValidationRules;
use App\Models\DefaultFolderTemplate;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreDefaultFolderTemplateRequest extends FormRequest
{
    use DefaultFolderTemplateValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('create', DefaultFolderTemplate::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->defaultFolderTemplateRules();
    }
}
