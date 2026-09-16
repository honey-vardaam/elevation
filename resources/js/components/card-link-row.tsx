import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

export function CardLinkRow({
    href,
    children,
    trailing,
}: {
    href: string;
    children: ReactNode;
    trailing?: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="hover:bg-muted/50 hover:border-muted-foreground/30 flex items-center justify-between gap-2 rounded-lg border p-3 text-sm transition-colors"
        >
            <div className="min-w-0">{children}</div>
            {trailing}
        </Link>
    );
}
