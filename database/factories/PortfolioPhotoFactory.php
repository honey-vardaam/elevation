<?php

namespace Database\Factories;

use App\Models\Portfolio;
use App\Models\PortfolioPhoto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PortfolioPhoto>
 */
class PortfolioPhotoFactory extends Factory
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
            'path' => 'portfolio/'.fake()->uuid().'.jpg',
            'caption' => fake()->optional()->sentence(4),
            'sort_order' => 0,
        ];
    }
}
