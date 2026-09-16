import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function Field({
    htmlFor,
    label,
    required,
    error,
    className,
    children,
}: {
    htmlFor?: string;
    label?: ReactNode;
    /** Marks the label with an asterisk - for fields the backend actually requires, not just ones that feel important. */
    required?: boolean;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('grid gap-2', className)}>
            {label && (
                <Label htmlFor={htmlFor}>
                    {label}
                    {required && (
                        <span
                            className="text-destructive ml-0.5"
                            aria-hidden="true"
                        >
                            *
                        </span>
                    )}
                </Label>
            )}
            {children}
            <InputError message={error} />
        </div>
    );
}
