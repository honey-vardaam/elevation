import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { useLayoutEffect, useState } from 'react';
import { ArrowRight, LayoutTemplate } from 'lucide-react';
import { CardFolder } from '@/components/card-folder';
import { EmptyState } from '@/components/empty-state';
import { Field } from '@/components/field';
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
    useLayoutEffect(() => {
        setLayoutProps({
            headerAction: (
                <NewPortfolioDialog availableYears={availableYears} />
            ),
        });
    }, [availableYears]);

    return (
        <>
            <Head title="Portfolio" />

            <h1 className="sr-only">Portfolio</h1>

            <div className="flex flex-1 flex-col gap-4 p-4">
                {portfolios.length === 0 ? (
                    <EmptyState
                        icon={LayoutTemplate}
                        message="No portfolios yet. Create one to get started."
                    />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

function PortfolioCard({
    portfolio,
    index,
}: {
    portfolio: PortfolioSummary;
    index: number;
}) {
    return (
        <Card className="group overflow-visible p-0">
            <Link href={show(portfolio.id)} className="flex h-full flex-col">
                <CardFolder imageUrl={portfolio.hero_url} seed={index}>
                    <div className="relative flex-1 px-5 pt-4 pb-5">
                        <h3 className="truncate pr-10 text-base font-semibold">
                            {portfolio.title ?? 'Untitled portfolio'}
                        </h3>
                        <p className="text-muted-foreground mt-1 truncate pr-10 text-xs">
                            {portfolio.year} &middot;{' '}
                            {portfolio.completed_count} completed &middot;{' '}
                            {portfolio.photos_count} photos
                        </p>

                        <span className="bg-muted text-foreground absolute right-5 bottom-5 z-10 flex h-9 items-center justify-center rounded-full px-2.5 transition-colors duration-500 ease-out">
                            <span className="grid grid-cols-[0fr] transition-all duration-500 ease-out group-hover:mr-1.5 group-hover:grid-cols-[1fr]">
                                <span className="overflow-hidden text-sm font-medium whitespace-nowrap">
                                    View portfolio
                                </span>
                            </span>
                            <ArrowRight className="size-4 shrink-0 transition-transform duration-500 ease-out group-hover:translate-x-0.5" />
                        </span>
                    </div>
                </CardFolder>
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
                            <Field error={errors.year}>
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
                            </Field>
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
