<?php

namespace Database\Factories;

use App\Models\Portfolio;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Portfolio>
 */
class PortfolioFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $year = fake()->unique()->numberBetween(2015, 2030);

        return [
            'year' => $year,
            'title' => "{$year} Portfolio",
            'intro' => fake()->optional()->paragraph(),
            'share_slug' => Str::slug(fake()->unique()->words(3, true)),
            'is_published' => false,
        ];
    }
}
