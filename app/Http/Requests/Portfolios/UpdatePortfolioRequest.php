<?php

namespace App\Http\Requests\Portfolios;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdatePortfolioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('portfolio'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:255'],
            'intro' => ['nullable', 'string', 'max:2000'],
            'hero_image' => ['nullable', 'image', 'max:8192'],
            'is_published' => ['boolean'],
        ];
    }
}
