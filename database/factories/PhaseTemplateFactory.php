<?php

namespace Database\Factories;

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
            'name' => fake()->unique()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'sort_order' => 0,
        ];
    }
}
