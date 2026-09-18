<?php

namespace Database\Factories;

use App\Enums\ProjectActivityType;
use App\Models\Project;
use App\Models\ProjectActivity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectActivity>
 */
class ProjectActivityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'causer_id' => User::factory(),
            'type' => ProjectActivityType::ProjectCreated,
            'meta' => null,
        ];
    }
}
