<?php

namespace Database\Factories;

use App\Models\Folder;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Folder>
 */
class FolderFactory extends Factory
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
            'parent_id' => null,
            'name' => fake()->randomElement(['Site Specification', '3D Rendering', 'Plan', 'Elevation']),
            'created_by' => User::factory(),
        ];
    }

    public function childOf(Folder $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => $parent->project_id,
            'parent_id' => $parent->id,
        ]);
    }
}
