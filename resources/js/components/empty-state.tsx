import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
    icon: Icon,
    message,
    className,
}: {
    icon: LucideIcon;
    message: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex size-full min-h-32 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center',
                className,
            )}
        >
            <Icon className="text-muted-foreground size-8 shrink-0" />
            <p className="text-muted-foreground text-sm">{message}</p>
        </div>
    );
}
