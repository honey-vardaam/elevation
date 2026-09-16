<?php

namespace App\Http\Requests\Teams;

use App\Concerns\TeamValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateTeamRequest extends FormRequest
{
    use TeamValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('team'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->teamRules();
    }
}
