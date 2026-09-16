import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

/** A muted drafting-paper grid, ruled in the theme's own foreground color. */
const GRID_PAPER =
    'bg-[linear-gradient(color-mix(in_oklch,var(--foreground)_2.5%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_2.5%,transparent)_1px,transparent_1px)] bg-[size:32px_32px]';

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className={cn('flex-1 p-4', GRID_PAPER)}>
            <div className="mx-auto max-w-xl space-y-8">{children}</div>
        </div>
    );
}
