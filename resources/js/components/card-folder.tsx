import type { ReactNode } from 'react';
import { bannerImageStyle } from '@/lib/banner-style';

/**
 * Theme-aware gradient panels used as the cover fallback wherever an item
 * has no image of its own (project/portfolio cards, the project detail
 * page's hero). Shared here so every fallback cover in the app draws from
 * the same palette instead of each place inventing its own.
 */
export const GRADIENTS = [
    'from-rose-200 via-fuchsia-100 to-orange-100 dark:from-rose-500/15 dark:via-fuchsia-500/10 dark:to-orange-400/10',
    'from-sky-200 via-indigo-100 to-violet-100 dark:from-sky-500/15 dark:via-indigo-500/10 dark:to-violet-400/10',
    'from-amber-100 via-rose-100 to-purple-100 dark:from-amber-400/15 dark:via-rose-500/10 dark:to-purple-400/10',
    'from-teal-100 via-sky-100 to-indigo-100 dark:from-teal-400/15 dark:via-sky-500/10 dark:to-indigo-400/10',
];

/** Deterministically picks a `GRADIENTS` entry for a given id, so the same item always gets the same fallback. */
export function pickGradient(seed: number): string {
    return GRADIENTS[Math.abs(seed) % GRADIENTS.length];
}

const COVER_RADIUS = 'rounded-t-[min(var(--radius-4xl),24px)]';

/**
 * The shell for gallery-style cards (projects, portfolios): a cover image
 * (the item's own image when it has one, otherwise a themed gradient) with a
 * curved folder-tab shape overlaid across its lower edge, and `children`
 * rendered on top of that shape as the card's body. Image, shape, and
 * layering all live here; the parent owns everything that gets rendered
 * inside (title, description, metadata, actions).
 */
export function CardFolder({
    imageUrl,
    imageFocalX = 50,
    imageFocalY = 50,
    imageZoom = 1,
    seed,
    children,
}: {
    imageUrl?: string | null;
    imageFocalX?: number;
    imageFocalY?: number;
    imageZoom?: number;
    seed: number;
    children: ReactNode;
}) {
    const gradient = pickGradient(seed);

    return (
        <div className="relative flex flex-1 flex-col">
            {/* Cover image / gradient fallback */}
            <div
                className={`relative h-40 w-full shrink-0 overflow-hidden ${COVER_RADIUS}`}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        style={bannerImageStyle(
                            imageFocalX,
                            imageFocalY,
                            imageZoom,
                        )}
                    />
                ) : (
                    <div
                        className={`h-full w-full bg-linear-to-br ${gradient}`}
                    />
                )}
            </div>

            {/* Folder SVG overlay - a curved tab overlapping the image's lower edge */}
            <svg
                viewBox="0 0 1000 400"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute inset-x-0 top-24 z-10 h-32 w-full"
            >
                <path
                    d="
                        M 0 40
                        C 0 18 18 0 40 0
                        H 390
                        C 430 0 450 18 468 48
                        C 484 74 505 90 545 90
                        H 962
                        C 983 90 1000 108 1000 128
                        V 400
                        H 0
                        Z
                    "
                    className="fill-card"
                />
            </svg>

            {/* Content - sits above the folder shape */}
            <div className="relative z-20 flex flex-1 flex-col">{children}</div>
        </div>
    );
}
