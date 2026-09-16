<?php

namespace App\Concerns;

use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProjectValidationRules
{
    /**
     * Get the validation rules used to validate projects.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function projectRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'banner' => ['nullable', 'image', 'max:5120'],
            'banner_focal_x' => ['nullable', 'numeric', 'between:0,100'],
            'banner_focal_y' => ['nullable', 'numeric', 'between:0,100'],
            'banner_zoom' => ['nullable', 'numeric', 'between:1,3'],
            'client_name' => ['nullable', 'string', 'max:255'],
            'client_email' => ['nullable', 'string', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:255'],
            'site_address' => ['nullable', 'string', 'max:255'],
            // Matches the site_area decimal(10,2) column - anything larger
            // would otherwise reach the database and fail as a raw "out of
            // range" SQL error instead of a validation message.
            'site_area' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', Rule::enum(ProjectStatus::class)],
            'type' => ['nullable', Rule::enum(ProjectType::class)],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function projectMessages(): array
    {
        return [
            'name.required' => 'Please enter a project name.',
            'name.max' => 'Project name must be 255 characters or fewer.',
            'description.max' => 'Description must be 2,000 characters or fewer.',
            'banner.image' => 'Banner must be an image file (JPG, PNG, GIF, etc).',
            'banner.max' => 'Banner image must be smaller than 5 MB.',
            'banner_focal_x.between' => 'Banner position is out of range.',
            'banner_focal_y.between' => 'Banner position is out of range.',
            'banner_zoom.between' => 'Banner zoom must be between 1x and 3x.',
            'client_email.email' => 'Enter a valid client email address.',
            'client_name.max' => 'Client name must be 255 characters or fewer.',
            'client_phone.max' => 'Client phone must be 255 characters or fewer.',
            'site_address.max' => 'Site address must be 255 characters or fewer.',
            'site_area.numeric' => 'Site area must be a number.',
            'site_area.min' => 'Site area cannot be negative.',
            'site_area.max' => 'Site area is too large.',
            'start_date.date' => 'Enter a valid start date.',
            'end_date.date' => 'Enter a valid end date.',
            'end_date.after_or_equal' => 'End date must be on or after the start date.',
            'status.enum' => 'Choose a valid project status.',
            'type.enum' => 'Choose a valid project type.',
            'latitude.numeric' => 'Latitude must be a number.',
            'latitude.between' => 'Latitude must be between -90 and 90.',
            'longitude.numeric' => 'Longitude must be a number.',
            'longitude.between' => 'Longitude must be between -180 and 180.',
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function projectAttributes(): array
    {
        return [
            'name' => 'project name',
            'client_name' => 'client name',
            'client_email' => 'client email',
            'client_phone' => 'client phone',
            'site_address' => 'site address',
            'site_area' => 'site area',
            'start_date' => 'start date',
            'end_date' => 'end date',
        ];
    }
}
