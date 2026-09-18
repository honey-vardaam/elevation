<?php

namespace App\Enums;

enum MoodboardElementType: string
{
    case Checklist = 'checklist';
    case Note = 'note';
    case Text = 'text';
    case Image = 'image';
    case Sticker = 'sticker';
    case Section = 'section';
}
