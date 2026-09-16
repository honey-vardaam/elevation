import type { CSSProperties } from 'react';

/** CSS for a cover image reflecting its saved reposition/zoom adjustment. */
export function bannerImageStyle(
    focalX: number,
    focalY: number,
    zoom: number,
): CSSProperties {
    return {
        objectPosition: `${focalX}% ${focalY}%`,
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    };
}
