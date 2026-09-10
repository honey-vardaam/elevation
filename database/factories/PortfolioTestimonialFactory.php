<?php

namespace Database\Factories;

use App\Models\Portfolio;
use App\Models\PortfolioTestimonial;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PortfolioTestimonial>
 */
class PortfolioTestimonialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'portfolio_id' => Portfolio::factory(),
            'author_name' => fake()->name(),
            'author_role' => fake()->optional()->jobTitle(),
            'quote' => fake()->paragraph(2),
            'sort_order' => 0,
        ];
    }
}
