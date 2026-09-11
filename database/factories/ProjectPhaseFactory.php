<?php

namespace Database\Factories;

use App\Enums\ProjectPhaseStatus;
use App\Models\PhaseTemplate;
use App\Models\Project;
use App\Models\ProjectPhase;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectPhase>
 */
class ProjectPhaseFactory extends Factory
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
            'phase_template_id' => PhaseTemplate::factory(),
            'name' => fake()->words(2, true),
            'sort_order' => 0,
            'status' => ProjectPhaseStatus::Pending,
        ];
    }
}
