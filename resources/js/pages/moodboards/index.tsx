import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import { type FormEvent, useLayoutEffect, useMemo, useState } from 'react';
import { Palette, Plus, User } from 'lucide-react';
import { pickGradient } from '@/components/card-folder';
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
import { cn } from '@/lib/utils';
import { index, show, store } from '@/routes/moodboards';
import type { MoodboardSummary } from '@/types';

type Scope = 'all' | 'personal' | 'project';
type ProjectOption = { id: number; name: string };

export default function MoodboardsIndex({
    moodboards,
    manageableProjects,
    projectFilter,
}: {
    moodboards: MoodboardSummary[];
    manageableProjects: ProjectOption[];
    projectFilter: number | null;
}) {
    const [scope, setScope] = useState<Scope>(
        projectFilter ? 'project' : 'all',
    );

    useLayoutEffect(() => {
        setLayoutProps({
            headerAction: (
                <NewMoodboardDialog
                    projects={manageableProjects}
                    defaultProjectId={projectFilter}
                />
            ),
        });
    }, [manageableProjects, projectFilter]);

    const projects = useMemo(() => {
        const seen = new Map<number, string>();
        moodboards.forEach(
            (m) => m.project && seen.set(m.project.id, m.project.name),
        );
        return [...seen].map(([id, name]) => ({ id, name }));
    }, [moodboards]);

    const visible = moodboards.filter((moodboard) =>
        scope === 'all'
            ? true
            : scope === 'personal'
              ? moodboard.project === null
              : moodboard.project !== null,
    );

    function filterByProject(value: string) {
        router.get(index().url, value === 'all' ? {} : { project: value }, {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Moodboards" />

            <h1 className="sr-only">Moodboards</h1>

            <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Tabs
                        value={scope}
                        onValueChange={(v) => setScope(v as Scope)}
                    >
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="personal">Personal</TabsTrigger>
                            <TabsTrigger value="project">Projects</TabsTrigger>
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
                        icon={Palette}
                        message={
                            scope === 'personal'
                                ? 'No personal moodboards yet.'
                                : scope === 'project'
                                  ? 'No project moodboards yet.'
                                  : 'No moodboards yet. Start a board for a project, or just for yourself.'
                        }
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {visible.map((moodboard) => (
                            <MoodboardCard
                                key={moodboard.id}
                                moodboard={moodboard}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function MoodboardCard({ moodboard }: { moodboard: MoodboardSummary }) {
    const percent =
        moodboard.items_total > 0
            ? Math.round((moodboard.items_done / moodboard.items_total) * 100)
            : 0;

    return (
        <Link
            href={show(moodboard.id).url}
            className="group bg-card hover:border-muted-foreground/30 flex flex-col overflow-hidden rounded-xl border transition-colors"
        >
            <div className="relative h-28 overflow-hidden">
                {moodboard.cover_url ? (
                    <img
                        src={moodboard.cover_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div
                        className={cn(
                            'h-full w-full bg-linear-to-br opacity-70',
                            pickGradient(moodboard.id),
                        )}
                    />
                )}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-medium">
                        {moodboard.title}
                    </p>
                    <Badge
                        variant="outline"
                        className="max-w-[45%] shrink-0 truncate"
                    >
                        {moodboard.project ? (
                            moodboard.project.name
                        ) : (
                            <>
                                <User className="size-3" /> Personal
                            </>
                        )}
                    </Badge>
                </div>

                <div className="mt-auto space-y-1.5">
                    {moodboard.items_total > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
                                <div
                                    className="bg-primary h-full rounded-full"
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                            <span className="text-muted-foreground text-xs tabular-nums">
                                {moodboard.items_done}/{moodboard.items_total}
                            </span>
                        </div>
                    )}
                    <p className="text-muted-foreground text-xs">
                        {moodboard.elements_count} item
                        {moodboard.elements_count === 1 ? '' : 's'} on board ·{' '}
                        {new Date(moodboard.updated_at).toLocaleDateString(
                            undefined,
                            {
                                month: 'short',
                                day: 'numeric',
                            },
                        )}
                        {moodboard.project && ` · ${moodboard.owner.name}`}
                    </p>
                </div>
            </div>
        </Link>
    );
}

function NewMoodboardDialog({
    projects,
    defaultProjectId,
}: {
    projects: ProjectOption[];
    defaultProjectId: number | null;
}) {
    const [open, setOpen] = useState(false);
    const canUseProjects = projects.length > 0;
    const initialProject =
        defaultProjectId && projects.some((p) => p.id === defaultProjectId)
            ? defaultProjectId
            : null;
    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        project_id: number | null;
    }>({ title: '', project_id: initialProject });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        post(store().url, { onSuccess: () => reset() });
    }

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                New moodboard
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogTitle>New moodboard</DialogTitle>
                    <DialogDescription>
                        A freeform board for material references, color
                        palettes, photos and design notes.
                    </DialogDescription>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field
                            htmlFor="moodboard-title"
                            label="Title"
                            required
                            error={errors.title}
                        >
                            <Input
                                id="moodboard-title"
                                value={data.title}
                                placeholder="Living room concept"
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                                autoFocus
                                required
                            />
                        </Field>

                        {canUseProjects && (
                            <Field
                                htmlFor="moodboard-project"
                                label="Belongs to"
                                error={errors.project_id}
                            >
                                <Select
                                    value={
                                        data.project_id
                                            ? String(data.project_id)
                                            : 'personal'
                                    }
                                    onValueChange={(value) =>
                                        setData(
                                            'project_id',
                                            value === 'personal'
                                                ? null
                                                : Number(value),
                                        )
                                    }
                                >
                                    <SelectTrigger id="moodboard-project">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="personal">
                                            Personal — only you can see it
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
                                {data.project_id && (
                                    <p className="text-muted-foreground text-xs">
                                        Every project member can view it; the
                                        owner and managers can edit.
                                    </p>
                                )}
                            </Field>
                        )}

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={processing || !data.title.trim()}
                            >
                                {processing && <Spinner />}
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

MoodboardsIndex.layout = {
    breadcrumbs: [{ title: 'Moodboards', href: index() }],
};
