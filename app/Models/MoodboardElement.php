<?php

namespace App\Models;

use App\Enums\MoodboardElementType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * @property string $id
 * @property int $moodboard_id
 * @property MoodboardElementType $type
 * @property float $x
 * @property float $y
 * @property float|null $width
 * @property float|null $height
 * @property int $z_index
 * @property array<string, mixed>|null $data
 * @property-read Moodboard $moodboard
 */
class MoodboardElement extends Model
{
    use HasUuids;

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => MoodboardElementType::class,
            'x' => 'float',
            'y' => 'float',
            'width' => 'float',
            'height' => 'float',
            'z_index' => 'integer',
            'data' => 'array',
        ];
    }

    public function moodboard(): BelongsTo
    {
        return $this->belongsTo(Moodboard::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toCanvasArray(): array
    {
        $data = $this->data ?? [];

        if ($this->type === MoodboardElementType::Image && isset($data['path'])) {
            $data['url'] = Storage::disk('public')->url($data['path']);
        }

        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'x' => $this->x,
            'y' => $this->y,
            'width' => $this->width,
            'height' => $this->height,
            'z_index' => $this->z_index,
            'data' => $data,
        ];
    }
}
