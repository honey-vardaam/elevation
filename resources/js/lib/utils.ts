import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/**
 * Truncates text to a character limit at a word boundary, appending an
 * ellipsis. Pairs with a CSS `line-clamp` on the element as a visual
 * safety net - this keeps the underlying text (and DOM size) bounded too,
 * so layout stays consistent regardless of how long the source text is.
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }

    const clipped = text.slice(0, maxLength);
    const lastSpace = clipped.lastIndexOf(' ');

    return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}
