<?php

namespace App\Enums;

enum ProjectType: string
{
    case Residential = 'residential';
    case Commercial = 'commercial';
    case Institutional = 'institutional';
    case Industrial = 'industrial';
    case Renovation = 'renovation';
    case Interior = 'interior';
    case Landscape = 'landscape';
    case MixedUse = 'mixed_use';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Residential => 'Residential',
            self::Commercial => 'Commercial',
            self::Institutional => 'Institutional',
            self::Industrial => 'Industrial',
            self::Renovation => 'Renovation',
            self::Interior => 'Interior',
            self::Landscape => 'Landscape',
            self::MixedUse => 'Mixed-Use',
            self::Other => 'Other',
        };
    }
}
