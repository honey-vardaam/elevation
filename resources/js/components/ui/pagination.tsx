import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PaginationLink } from '@/types';

const PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

/**
 * Renders a Laravel paginator's `links`/`from`/`to`/`total` meta as a
 * page-number control + "Showing X-Y of Z" summary, plus a "rows per page"
 * selector when `perPage` is provided. Page links carry a full URL (query
 * string included) straight from the backend, so navigating is a plain
 * Inertia GET - no client-side page-state to keep in sync.
 */
export function Pagination({
    links,
    from,
    to,
    total,
    perPage,
    className,
}: {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    perPage?: number;
    className?: string;
}) {
    if (total === 0) {
        return null;
    }

    function changePerPage(value: string) {
        router.get(
            window.location.pathname,
            { per_page: value },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    const previous = links[0];
    const next = links[links.length - 1];
    const pages = links.slice(1, -1);

    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-between gap-3',
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-4">
                <p className="text-muted-foreground text-sm">
                    Showing {from}–{to} of {total}
                </p>

                {perPage !== undefined && (
                    <label className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        Rows per page
                        <Select
                            value={String(perPage)}
                            onValueChange={changePerPage}
                        >
                            <SelectTrigger size="sm" className="w-[4.5rem]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PER_PAGE_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option}
                                        value={String(option)}
                                    >
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                )}
            </div>

            {links.length > 3 && (
                <div className="flex items-center gap-1">
                    <EdgeButton link={previous} label="Previous page">
                        <ChevronLeft className="size-4" />
                    </EdgeButton>

                    {pages.map((link, i) =>
                        link.url === null ? (
                            <span
                                key={i}
                                className="text-muted-foreground px-2 text-sm"
                            >
                                {link.label}
                            </span>
                        ) : (
                            <Button
                                key={i}
                                asChild
                                variant={link.active ? 'default' : 'ghost'}
                                size="icon-sm"
                            >
                                <Link href={link.url} preserveScroll>
                                    {link.label}
                                </Link>
                            </Button>
                        ),
                    )}

                    <EdgeButton link={next} label="Next page">
                        <ChevronRight className="size-4" />
                    </EdgeButton>
                </div>
            )}
        </div>
    );
}

function EdgeButton({
    link,
    label,
    children,
}: {
    link: PaginationLink;
    label: string;
    children: React.ReactNode;
}) {
    if (link.url === null) {
        return (
            <Button variant="ghost" size="icon-sm" disabled>
                <span className="sr-only">{label}</span>
                {children}
            </Button>
        );
    }

    return (
        <Button asChild variant="ghost" size="icon-sm">
            <Link href={link.url} preserveScroll aria-label={label}>
                {children}
            </Link>
        </Button>
    );
}
