<?php

namespace App\Http\Requests\Portfolios;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StorePortfolioPhotoRequest extends FormRequest
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
            'photo' => ['required', 'image', 'max:8192'],
            'caption' => ['nullable', 'string', 'max:255'],
        ];
    }
}
