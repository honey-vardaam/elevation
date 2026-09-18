import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import { type FormEvent, useLayoutEffect, useMemo, useState } from 'react';
import { GitCompareArrows, Plus } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Field } from '@/components/field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fileIconFor } from '@/lib/file-display';
import { index, show, store } from '@/routes/comparisons';
import type { ComparisonSummary } from '@/types';

type Scope = 'all' | 'complete' | 'pending';
type ProjectOption = { id: number; name: string };

export default function ComparisonsIndex({
    comparisons,
    accessibleProjects,
    projectFilter,
}: {
    comparisons: ComparisonSummary[];
    accessibleProjects: ProjectOption[];
    projectFilter: number | null;
}) {
    const [scope, setScope] = useState<Scope>('all');

    useLayoutEffect(() => {
        setLayoutProps({
            headerAction: <NewComparisonDialog projects={accessibleProjects} />,
        });
    }, [accessibleProjects]);

    const projects = useMemo(() => {
        const seen = new Map<number, string>();
        comparisons.forEach((c) => seen.set(c.project.id, c.project.name));
        return [...seen].map(([id, name]) => ({ id, name }));
    }, [comparisons]);

    const visible = comparisons.filter((comparison) =>
        scope === 'all'
            ? true
            : scope === 'complete'
              ? comparison.is_complete
              : !comparison.is_complete,
    );

    function filterByProject(value: string) {
        router.get(index().url, value === 'all' ? {} : { project: value }, {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Smart Comparison" />

            <h1 className="sr-only">Smart Comparison</h1>

            <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Tabs
                        value={scope}
                        onValueChange={(v) => setScope(v as Scope)}
                    >
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="complete">Ready</TabsTrigger>
                            <TabsTrigger value="pending">
                                Needs a second file
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {(projects.length > 0 || projectFilter) && (
                        <Select
                            value={
                                projectFilter ? String(projectFilter) : 'all'
                            }
                            onValueChange={filterByProject}
                        >
                            <SelectTrigger className="w-52">
                                <SelectValue placeholder="All projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All projects
                                </SelectItem>
                                {projects.map((project) => (
                                    <SelectItem
                                        key={project.id}
                                        value={String(project.id)}
                                    >
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {visible.length === 0 ? (
                    <EmptyState
                        icon={GitCompareArrows}
                        message={
                            scope === 'pending'
                                ? 'Nothing waiting on a second file.'
                                : 'No comparisons yet. Send a file over from a project to start one.'
                        }
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {visible.map((comparison) => (
                            <ComparisonCard
                                key={comparison.id}
                                comparison={comparison}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function ComparisonCard({ comparison }: { comparison: ComparisonSummary }) {
    const LeftIcon = fileIconFor(comparison.left_file?.mime_type ?? null);
    const RightIcon = fileIconFor(comparison.right_file?.mime_type ?? null);

    return (
        <Link
            href={show(comparison.id).url}
            className="group bg-card hover:border-muted-foreground/30 flex flex-col overflow-hidden rounded-xl border transition-colors"
        >
            <div className="bg-muted/40 flex h-28 items-center justify-center gap-3">
                <LeftIcon
                    className="text-muted-foreground size-9"
                    strokeWidth={1.25}
                />
                <GitCompareArrows className="text-muted-foreground/60 size-4 shrink-0" />
                {comparison.right_file ? (
                    <RightIcon
                        className="text-muted-foreground size-9"
                        strokeWidth={1.25}
                    />
                ) : (
                    <div className="border-muted-foreground/30 flex size-9 items-center justify-center rounded border border-dashed">
                        <Plus className="text-muted-foreground/50 size-4" />
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-medium">
                        {comparison.title}
                    </p>
                    {!comparison.is_complete && (
                        <Badge variant="outline" className="shrink-0">
                            Needs a file
                        </Badge>
                    )}
                </div>

                <div className="mt-auto space-y-1">
                    <p className="text-muted-foreground truncate text-xs">
                        {comparison.project.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                        Started by {comparison.creator.name} ·{' '}
                        {new Date(comparison.updated_at).toLocaleDateString(
                            undefined,
                            { month: 'short', day: 'numeric' },
                        )}
                    </p>
                </div>
            </div>
        </Link>
    );
}

function NewComparisonDialog({ projects }: { projects: ProjectOption[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        project_id: number | null;
    }>({ title: '', project_id: projects[0]?.id ?? null });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!data.project_id) {
            return;
        }
        post(store().url, { onSuccess: () => reset() });
    }

    if (projects.length === 0) {
        return null;
    }

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                New comparison
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogTitle>New comparison</DialogTitle>
                    <DialogDescription>
                        Pick a project to start from. You'll choose which two
                        files to compare next.
                    </DialogDescription>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field
                            htmlFor="comparison-project"
                            label="Project"
                            required
                            error={errors.project_id}
                        >
                            <Select
                                value={
                                    data.project_id
                                        ? String(data.project_id)
                                        : ''
                                }
                                onValueChange={(value) =>
                                    setData('project_id', Number(value))
                                }
                            >
                                <SelectTrigger id="comparison-project">
                                    <SelectValue placeholder="Choose a project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((project) => (
                                        <SelectItem
                                            key={project.id}
                                            value={String(project.id)}
                                        >
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field
                            htmlFor="comparison-title"
                            label="Title (optional)"
                            error={errors.title}
                        >
                            <Input
                                id="comparison-title"
                                value={data.title}
                                placeholder="Defaults to the first file's name"
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                            />
                        </Field>

                        <p className="text-muted-foreground text-xs">
                            After creating it, pick the project file to start
                            from — you can also send a file straight to Smart
                            Comparison from a project's files list.
                        </p>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={processing || !data.project_id}
                            >
                                {processing && <Spinner />}
                                Continue
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ComparisonsIndex.layout = {
    breadcrumbs: [{ title: 'Smart Comparison', href: index() }],
};
