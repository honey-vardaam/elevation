<?php

namespace App\Models;

use Database\Factories\DefaultFolderTemplateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name'])]
class DefaultFolderTemplate extends Model
{
    /** @use HasFactory<DefaultFolderTemplateFactory> */
    use HasFactory;
}
