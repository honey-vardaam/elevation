<?php

namespace Database\Factories;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectMember>
 */
class ProjectMemberFactory extends Factory
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
            'user_id' => User::factory(),
            'role' => fake()->randomElement(ProjectRole::cases()),
        ];
    }

    public function manager(): static
    {
        return $this->state(fn (array $attributes) => ['role' => ProjectRole::Manager]);
    }

    public function editor(): static
    {
        return $this->state(fn (array $attributes) => ['role' => ProjectRole::Editor]);
    }

    public function viewer(): static
    {
        return $this->state(fn (array $attributes) => ['role' => ProjectRole::Viewer]);
    }
}
