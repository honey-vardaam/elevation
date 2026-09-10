<?php

namespace App\Enums;

enum PortfolioSectionType: string
{
    case Hero = 'hero';
    case Stats = 'stats';
    case Map = 'map';
    case Gallery = 'gallery';
    case Testimonials = 'testimonials';
    case CompanyInfo = 'company_info';
    case CustomText = 'custom_text';

    public function label(): string
    {
        return match ($this) {
            self::Hero => 'Hero',
            self::Stats => 'Stats',
            self::Map => 'Map',
            self::Gallery => 'Gallery',
            self::Testimonials => 'Testimonials',
            self::CompanyInfo => 'Company info',
            self::CustomText => 'Text section',
        };
    }

    /**
     * Custom sections can be deleted outright; built-in sections can only
     * be hidden (a portfolio without a Hero row doesn't make sense).
     */
    public function isDeletable(): bool
    {
        return $this === self::CustomText;
    }

    /**
     * The default set of built-in sections created for every new portfolio,
     * in display order.
     *
     * @return array<int, self>
     */
    public static function defaults(): array
    {
        return [
            self::Hero,
            self::Stats,
            self::Map,
            self::Gallery,
            self::Testimonials,
            self::CompanyInfo,
        ];
    }
}
