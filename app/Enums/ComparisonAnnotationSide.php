<?php

namespace App\Enums;

/**
 * Which pane an annotation is pinned to - or `General` for an unpinned
 * discussion comment that isn't tied to a specific point on either file.
 */
enum ComparisonAnnotationSide: string
{
    case Left = 'left';
    case Right = 'right';
    case General = 'general';
}
