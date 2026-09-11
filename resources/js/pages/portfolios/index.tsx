import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronRight, FolderOpen, LayoutTemplate } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { index, show, store } from '@/routes/portfolios';
import type { PortfolioSummary } from '@/types';

export default function Index({
    portfolios,
    availableYears,
}: {
    portfolios: PortfolioSummary[];
    availableYears: number[];
}) {
    return (
        <>
            <Head title="Portfolio" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                        Year-wise portfolios of your firm's work.
                    </p>
                    <NewPortfolioDialog availableYears={availableYears} />
                </div>

                {portfolios.length === 0 ? (
                    <EmptyState
                        icon={LayoutTemplate}
                        message="No portfolios yet. Create one to get started."
                    />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {portfolios.map((portfolio, i) => (
                            <PortfolioCard
                                key={portfolio.id}
                                portfolio={portfolio}
                                index={i}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

const PANEL_GRADIENTS = [
    'from-rose-200 via-fuchsia-100 to-orange-100 dark:from-rose-500/15 dark:via-fuchsia-500/10 dark:to-orange-400/10',
    'from-sky-200 via-indigo-100 to-violet-100 dark:from-sky-500/15 dark:via-indigo-500/10 dark:to-violet-400/10',
    'from-amber-100 via-rose-100 to-purple-100 dark:from-amber-400/15 dark:via-rose-500/10 dark:to-purple-400/10',
    'from-teal-100 via-sky-100 to-indigo-100 dark:from-teal-400/15 dark:via-sky-500/10 dark:to-indigo-400/10',
];

function PortfolioCard({
    portfolio,
    index,
}: {
    portfolio: PortfolioSummary;
    index: number;
}) {
    const gradient = PANEL_GRADIENTS[index % PANEL_GRADIENTS.length];

    return (
        <Card className="group overflow-hidden p-0">
            <Link href={show(portfolio.id)} className="block">
                <div
                    className={`flex h-36 flex-col justify-between bg-gradient-to-br p-4 ${gradient}`}
                >
                    <div className="bg-foreground text-background flex size-8 items-center justify-center rounded-full">
                        <FolderOpen className="size-4" />
                    </div>
                    <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        Portfolio
                    </p>
                </div>

                <div className="relative px-5 pt-4 pb-5">
                    <h3 className="truncate pr-10 text-base font-semibold">
                        {portfolio.title ?? 'Untitled portfolio'}
                    </h3>
                    <p className="text-muted-foreground mt-1 truncate pr-10 text-xs">
                        {portfolio.year} &middot; {portfolio.completed_count}{' '}
                        completed &middot; {portfolio.photos_count} photos
                    </p>

                    <span className="bg-muted text-foreground group-hover:bg-chart-2 absolute right-5 bottom-5 flex size-8 items-center justify-center rounded-full transition-colors duration-300 ease-out group-hover:text-white">
                        <ChevronRight className="size-4" />
                    </span>
                </div>
            </Link>
        </Card>
    );
}

function NewPortfolioDialog({ availableYears }: { availableYears: number[] }) {
    const [open, setOpen] = useState(false);
    const [year, setYear] = useState<string>(
        availableYears[0] ? String(availableYears[0]) : '',
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={availableYears.length === 0}>
                    New Portfolio
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>New portfolio</DialogTitle>
                <Form
                    {...store.form()}
                    transform={(data) => ({ ...data, year })}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableYears.map((y) => (
                                            <SelectItem
                                                key={y}
                                                value={String(y)}
                                            >
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.year} />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={processing || !year}
                                >
                                    {processing && <Spinner />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Portfolio', href: index() }],
};
