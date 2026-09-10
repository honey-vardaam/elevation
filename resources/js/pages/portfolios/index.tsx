import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Copy, ImageIcon, LayoutTemplate } from 'lucide-react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                        Year-wise portfolios of your firm's work.
                    </p>
                    <NewPortfolioDialog availableYears={availableYears} />
                </div>

                {portfolios.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center">
                        <LayoutTemplate className="text-muted-foreground size-8" />
                        <p className="text-muted-foreground text-sm">
                            No portfolios yet. Create one to get started.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {portfolios.map((portfolio) => (
                            <Card
                                key={portfolio.id}
                                className="overflow-hidden pt-0"
                            >
                                {portfolio.hero_url ? (
                                    <img
                                        src={portfolio.hero_url}
                                        alt=""
                                        className="h-32 w-full object-cover"
                                    />
                                ) : (
                                    <div className="bg-muted flex h-32 w-full items-center justify-center">
                                        <ImageIcon className="text-muted-foreground size-8" />
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>
                                            <Link
                                                href={show(portfolio.id)}
                                                className="hover:underline"
                                            >
                                                {portfolio.title ??
                                                    `${portfolio.year} Portfolio`}
                                            </Link>
                                        </CardTitle>
                                        <Badge
                                            variant={
                                                portfolio.is_published
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {portfolio.is_published
                                                ? 'Published'
                                                : 'Draft'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3">
                                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                        <span>
                                            {portfolio.completed_count}{' '}
                                            completed
                                        </span>
                                        <span>&middot;</span>
                                        <span>
                                            {portfolio.photos_count} photos
                                        </span>
                                        <span>&middot;</span>
                                        <span>
                                            {portfolio.testimonials_count}{' '}
                                            testimonials
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={show(portfolio.id)}>
                                                Edit
                                            </Link>
                                        </Button>
                                        {portfolio.share_url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    navigator.clipboard.writeText(
                                                        portfolio.share_url!,
                                                    )
                                                }
                                            >
                                                <Copy className="size-4" />
                                                Copy link
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function NewPortfolioDialog({
    availableYears,
}: {
    availableYears: number[];
}) {
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
                                    <Button variant="secondary">
                                        Cancel
                                    </Button>
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
