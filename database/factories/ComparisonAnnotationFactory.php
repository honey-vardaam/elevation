<?php

namespace Database\Factories;

use App\Models\Comparison;
use App\Models\ComparisonAnnotation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ComparisonAnnotation>
 */
class ComparisonAnnotationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'comparison_id' => Comparison::factory(),
            'user_id' => User::factory(),
            'side' => 'general',
            'x' => null,
            'y' => null,
            'body' => fake()->sentence(),
        ];
    }
}
