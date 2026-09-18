<?php

namespace App\Http\Requests\Moodboards;

use App\Enums\MoodboardElementType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SyncMoodboardCanvasRequest extends FormRequest
{
    public const COLORS = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange', 'gray'];

    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('moodboard'));
    }

    /**
     * @return array<string, ValidationRule|\Closure|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'elements' => ['present', 'array', 'max:500'],
            'elements.*.id' => ['required', 'uuid', 'distinct'],
            'elements.*.type' => ['required', Rule::enum(MoodboardElementType::class)],
            'elements.*.x' => ['required', 'numeric', 'between:-100000,100000'],
            'elements.*.y' => ['required', 'numeric', 'between:-100000,100000'],
            'elements.*.width' => ['nullable', 'numeric', 'between:10,10000'],
            'elements.*.height' => ['nullable', 'numeric', 'between:10,10000'],
            'elements.*.z_index' => ['required', 'integer', 'between:-100000,100000'],
            'elements.*.data' => ['nullable', 'array'],
            'elements.*.data.title' => ['nullable', 'string', 'max:255'],
            'elements.*.data.text' => ['nullable', 'string', 'max:10000'],
            'elements.*.data.color' => ['nullable', Rule::in(self::COLORS)],
            'elements.*.data.size' => ['nullable', Rule::in(['sm', 'md', 'lg', 'xl'])],
            'elements.*.data.emoji' => ['nullable', 'string', 'max:16'],
            'elements.*.data.label' => ['nullable', 'string', 'max:40'],
            'elements.*.data.path' => ['nullable', 'string', 'max:255'],
            'elements.*.data.items' => ['nullable', 'array', 'max:200'],
            'elements.*.data.items.*.id' => ['required', 'string', 'max:64'],
            'elements.*.data.items.*.text' => ['nullable', 'string', 'max:1000'],
            'elements.*.data.items.*.done' => ['required', 'boolean'],
        ];
    }
}
