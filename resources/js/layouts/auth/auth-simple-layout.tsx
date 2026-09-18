import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="bg-background relative flex min-h-svh flex-col items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Subtle architectural drafting paper grid */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_2.5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_2.5%,transparent)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
            />

            {/* Subtle ambient light glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1/3 left-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.02] blur-3xl"
            />

            <div className="relative z-10 w-full max-w-md">
                {/* Brand header */}
                <div className="mb-6 flex flex-col items-center gap-2 text-center">
                    <Link
                        href={home()}
                        className="group flex flex-col items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]"
                    >
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-md ring-1 ring-black/5 dark:bg-neutral-100 dark:text-neutral-900 dark:ring-white/10">
                            <AppLogoIcon className="size-6 fill-current" />
                        </div>
                        <span className="font-poppins text-2xl font-bold tracking-tight text-foreground">
                            {name}
                        </span>
                    </Link>
                </div>

                {/* Auth Card */}
                <Card className="rounded-2xl border border-border/80 bg-card/90 shadow-xl shadow-black/[0.03] backdrop-blur-sm dark:shadow-black/25">
                    <CardHeader className="space-y-1.5 px-6 pt-7 pb-4 text-center sm:px-8">
                        <CardTitle className="font-poppins text-xl font-semibold tracking-tight text-foreground">
                            {title}
                        </CardTitle>
                        {description && (
                            <CardDescription className="text-muted-foreground text-sm">
                                {description}
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="px-6 pb-8 pt-2 sm:px-8">
                        {children}
                    </CardContent>
                </Card>

                <p className="text-muted-foreground/60 mt-6 text-center text-xs">
                    &copy; {new Date().getFullYear()} {name}. Built for architectural &amp; project teams.
                </p>
            </div>
        </div>
    );
}

