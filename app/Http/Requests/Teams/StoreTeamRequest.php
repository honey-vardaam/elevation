<?php

namespace App\Http\Requests\Teams;

use App\Concerns\TeamValidationRules;
use App\Models\Team;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreTeamRequest extends FormRequest
{
    use TeamValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('create', Team::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->teamRules();
    }
}
