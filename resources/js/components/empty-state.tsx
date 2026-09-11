import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
    icon: Icon,
    message,
}: {
    icon: LucideIcon;
    message: ReactNode;
}) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center">
            <Icon className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">{message}</p>
        </div>
    );
}
