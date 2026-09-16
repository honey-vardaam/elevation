import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { useLayoutEffect, useMemo, useState } from 'react';
import { FolderKanban, MoreHorizontal } from 'lucide-react';
import { CardFolder } from '@/components/card-folder';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { EmptyState } from '@/components/empty-state';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { NewProjectDialog } from '@/components/projects/new-project-dialog';
import {
    PROJECT_STATUSES,
    ProjectStatusSelect,
} from '@/components/projects/project-status-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { truncate } from '@/lib/utils';
import { destroy, index, show, update } from '@/routes/projects';
import type {
    AssignableUser,
    ProjectStatus,
    ProjectSummary,
    TeamSummary,
} from '@/types';

const UNSPECIFIED_YEAR = 'unspecified';
const ALL_YEARS = 'all';
const DESCRIPTION_LIMIT = 135;

export default function Index({
    projects,
    can,
    assignableUsers,
    teams,
    hasPhaseTemplates,
}: {
    projects: ProjectSummary[];
    can: { create: boolean };
    assignableUsers: AssignableUser[];
    teams: TeamSummary[];
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
                className="hover:border-muted-foreground/30 overflow-visible pt-0 transition-colors"
            >
                <CardFolder
                    imageUrl={project.banner_url}
                    imageFocalX={project.banner_focal_x}
                    imageFocalY={project.banner_focal_y}
                    imageZoom={project.banner_zoom}
                    seed={project.id}
                >
                    <CardHeader className="text-left">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="max-w-[80%] min-w-0 truncate">
                                <Link
                                    href={show(project.id)}
                                    className="hover:underline"
                                >
                                    {project.name}
                                </Link>
                            </CardTitle>
                            {(project.can.update || project.can.delete) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="shrink-0 rounded-full"
                                        >
                                            <MoreHorizontal className="size-4" />
                                            <span className="sr-only">
                                                Project actions
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {project.can.update && (
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    setEditing(project)
                                                }
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
                            )}
                        </div>
                        <CardDescription className="line-clamp-3 min-h-[3.75rem] max-w-[80%] min-w-0">
                            {project.description &&
                                truncate(
                                    project.description,
                                    DESCRIPTION_LIMIT,
                                )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-3 flex max-w-[80%] flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
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
                        </div>
                    </CardContent>
                </CardFolder>
            </Card>
        );
    }

    useLayoutEffect(() => {
        setLayoutProps({
            headerAction: can.create ? (
                <NewProjectDialog
                    assignableUsers={assignableUsers}
                    teams={teams}
                    hasPhaseTemplates={hasPhaseTemplates}
                />
            ) : undefined,
        });
    }, [can.create, assignableUsers, teams, hasPhaseTemplates]);

    return (
        <>
            <Head title="Projects" />

            <h1 className="sr-only">Projects</h1>

            <div className="flex flex-1 flex-col gap-4 p-4">
                {projects.length === 0 ? (
                    <EmptyState
                        icon={FolderKanban}
                        message="No projects yet. Create one to get started."
                    />
                ) : (
                    <Tabs defaultValue="ongoing" className="gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
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

                            {(years.numeric.length > 0 ||
                                years.hasUnspecified) && (
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
                                            <SelectItem
                                                value={UNSPECIFIED_YEAR}
                                            >
                                                Unspecified
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

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
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete project?"
                description={
                    <>
                        This permanently deletes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>
                        , including every folder and file inside it. This cannot
                        be undone.
                    </>
                }
                confirmLabel="Delete project"
                formAction={deleting ? destroy.form(deleting.id) : undefined}
                onSuccess={() => setDeleting(null)}
            />
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Projects', href: index() }],
};
