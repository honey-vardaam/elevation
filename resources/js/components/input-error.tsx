import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Animates open/closed via a grid-rows trick instead of mounting/unmounting
 * the message - so a validation error appearing doesn't yank the rest of
 * the form down, and takes zero space when there's nothing to show.
 */
export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return (
        <div
            className={cn(
                'grid transition-[grid-template-rows] duration-200 ease-out',
                message ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
        >
            <p
                {...props}
                role={message ? 'alert' : undefined}
                className={cn(
                    'overflow-hidden text-sm text-red-600 dark:text-red-400',
                    className,
                )}
            >
                {message}
            </p>
        </div>
    );
}
