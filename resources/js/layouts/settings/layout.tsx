import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

/** A fine drafting-paper grid, ruled in the theme's own foreground color. */
const GRID_MINOR =
    'bg-[linear-gradient(color-mix(in_oklch,var(--foreground)_2%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_2%,transparent)_1px,transparent_1px)] bg-[size:24px_24px]';

/** Coarser guide lines every fourth minor cell, like a CAD canvas's major grid. */
const GRID_MAJOR =
    'bg-[linear-gradient(color-mix(in_oklch,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_6%,transparent)_1px,transparent_1px)] bg-[size:96px_96px]';

/** Small L-shaped registration marks, the framing mark on a drawing sheet. */
function CornerMarks() {
    return (
        <div
            className="text-foreground/15 pointer-events-none absolute -inset-4 hidden sm:block"
            aria-hidden="true"
        >
            <span className="absolute top-0 left-0 size-2.5 border-t border-l border-current" />
            <span className="absolute top-0 right-0 size-2.5 border-t border-r border-current" />
            <span className="absolute bottom-0 left-0 size-2.5 border-b border-l border-current" />
            <span className="absolute right-0 bottom-0 size-2.5 border-r border-b border-current" />
        </div>
    );
}

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className={cn('relative flex-1 p-4', GRID_MINOR)}>
            <div
                className={cn(
                    'pointer-events-none absolute inset-0',
                    GRID_MAJOR,
                )}
                aria-hidden="true"
            />
            <div className="relative mx-auto max-w-xl space-y-8">
                <CornerMarks />
                {children}
            </div>
        </div>
    );
}
