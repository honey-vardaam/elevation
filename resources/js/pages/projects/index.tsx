import { Form, Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { FolderKanban, MoreHorizontal } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { NewProjectSheet } from '@/components/projects/new-project-sheet';
import {
    PROJECT_STATUSES,
    ProjectStatusSelect,
} from '@/components/projects/project-status-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { destroy, index, show, update } from '@/routes/projects';
import type { AssignableUser, ProjectStatus, ProjectSummary } from '@/types';

const UNSPECIFIED_YEAR = 'unspecified';
const ALL_YEARS = 'all';

export default function Index({
    projects,
    can,
    assignableUsers,
    hasPhaseTemplates,
}: {
    projects: ProjectSummary[];
    can: { create: boolean };
    assignableUsers: AssignableUser[];
    hasPhaseTemplates: boolean;
}) {
    const [editing, setEditing] = useState<ProjectSummary | null>(null);
    const [deleting, setDeleting] = useState<ProjectSummary | null>(null);
    const [year, setYear] = useState<string>(ALL_YEARS);

    function projectYear(project: ProjectSummary): string {
        return project.start_date?.slice(0, 4) ?? UNSPECIFIED_YEAR;
    }

    const years = useMemo(() => {
        const found = new Set(projects.map(projectYear));
        const numeric = [...found]
            .filter((y) => y !== UNSPECIFIED_YEAR)
            .sort((a, b) => Number(b) - Number(a));

        return {
            numeric,
            hasUnspecified: found.has(UNSPECIFIED_YEAR),
        };
    }, [projects]);

    const visibleProjects = useMemo(
        () =>
            year === ALL_YEARS
                ? projects
                : projects.filter((p) => projectYear(p) === year),
        [projects, year],
    );

    function handleStatusChange(
        project: ProjectSummary,
        status: ProjectStatus,
    ) {
        router.patch(
            update(project.id).url,
            { status },
            { preserveScroll: true },
        );
    }

    function renderProjectCard(project: ProjectSummary) {
        return (
            <Card
                key={project.id}
                className={`overflow-hidden ${project.banner_url ? 'pt-0' : ''}`}
            >
                {project.banner_url && (
                    <img
                        src={project.banner_url}
                        alt=""
                        className="h-32 w-full object-cover"
                    />
                )}
                <CardHeader>
                    <CardTitle className="min-w-0 truncate">
                        <Link
                            href={show(project.id)}
                            className="hover:underline"
                        >
                            {project.name}
                        </Link>
                    </CardTitle>
                    {project.description && (
                        <CardDescription className="line-clamp-2 min-w-0">
                            {project.description}
                        </CardDescription>
                    )}
                    {(project.can.update || project.can.delete) && (
                        <CardAction>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon-sm">
                                        <MoreHorizontal className="size-4" />
                                        <span className="sr-only">
                                            Project actions
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {project.can.update && (
                                        <DropdownMenuItem
                                            onSelect={() => setEditing(project)}
                                        >
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {project.can.delete && (
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() =>
                                                setDeleting(project)
                                            }
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardAction>
                    )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline" className="capitalize">
                            {project.role}
                        </Badge>
                        <span>{project.folders_count} folders</span>
                        <span>&middot;</span>
                        <span>{project.files_count} files</span>
                        <span>&middot;</span>
                        <span>{project.members_count} members</span>
                    </div>
                    {project.can.update ? (
                        <ProjectStatusSelect
                            value={project.status}
                            onValueChange={(status) =>
                                handleStatusChange(project, status)
                            }
                            className="h-8 w-fit"
                        />
                    ) : (
                        <Badge variant="secondary" className="w-fit">
                            {
                                PROJECT_STATUSES.find(
                                    (s) => s.value === project.status,
                                )?.label
                            }
                        </Badge>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Head title="Projects" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-muted-foreground text-sm">
                        Projects you own or have been given access to.
                    </p>

                    <div className="flex items-center gap-2">
                        {(years.numeric.length > 0 || years.hasUnspecified) && (
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All years" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_YEARS}>
                                        All years
                                    </SelectItem>
                                    {years.numeric.map((y) => (
                                        <SelectItem key={y} value={y}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                    {years.hasUnspecified && (
                                        <SelectItem value={UNSPECIFIED_YEAR}>
                                            Unspecified
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        )}

                        {can.create && (
                            <NewProjectSheet
                                assignableUsers={assignableUsers}
                                hasPhaseTemplates={hasPhaseTemplates}
                            />
                        )}
                    </div>
                </div>

                {projects.length === 0 ? (
                    <EmptyState
                        icon={FolderKanban}
                        message="No projects yet. Create one to get started."
                    />
                ) : (
                    <Tabs defaultValue="ongoing" className="gap-4">
                        <TabsList>
                            {PROJECT_STATUSES.map((status) => {
                                const count = visibleProjects.filter(
                                    (p) => p.status === status.value,
                                ).length;

                                return (
                                    <TabsTrigger
                                        key={status.value}
                                        value={status.value}
                                    >
                                        {status.label}
                                        <Badge
                                            variant="secondary"
                                            className="ml-1"
                                        >
                                            {count}
                                        </Badge>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        {PROJECT_STATUSES.map((status) => {
                            const filtered = visibleProjects.filter(
                                (p) => p.status === status.value,
                            );

                            return (
                                <TabsContent
                                    key={status.value}
                                    value={status.value}
                                >
                                    {filtered.length === 0 ? (
                                        <EmptyState
                                            icon={FolderKanban}
                                            message={`No ${status.label.toLowerCase()} projects.`}
                                        />
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {filtered.map(renderProjectCard)}
                                        </div>
                                    )}
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                )}
            </div>

            <EditProjectDialog
                project={editing}
                onOpenChange={(open) => !open && setEditing(null)}
            />

            <Dialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent>
                    <DialogTitle>Delete project?</DialogTitle>
                    <p className="text-muted-foreground text-sm">
                        This permanently deletes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>
                        , including every folder and file inside it. This cannot
                        be undone.
                    </p>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        {deleting && (
                            <Form
                                {...destroy.form(deleting.id)}
                                onSuccess={() => setDeleting(null)}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        {processing && <Spinner />}
                                        Delete project
                                    </Button>
                                )}
                            </Form>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Projects', href: index() }],
};
