<?php

namespace Database\Factories;

use App\Models\PhaseFlowTemplate;
use App\Models\PhaseTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PhaseTemplate>
 */
class PhaseTemplateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'phase_flow_template_id' => PhaseFlowTemplate::factory(),
            'name' => fake()->unique()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'sort_order' => 0,
            'position_x' => 0,
            'position_y' => 0,
        ];
    }
}
