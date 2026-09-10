import { Form, Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FolderKanban, MoreHorizontal } from 'lucide-react';
import InputError from '@/components/input-error';
import { NewProjectSheet } from '@/components/projects/new-project-sheet';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { destroy, index, show, update } from '@/routes/projects';
import type { AssignableUser, ProjectStatus, ProjectSummary } from '@/types';

export default function Index({
    projects,
    can,
    assignableUsers,
}: {
    projects: ProjectSummary[];
    can: { create: boolean };
    assignableUsers: AssignableUser[];
}) {
    const [renaming, setRenaming] = useState<ProjectSummary | null>(null);
    const [deleting, setDeleting] = useState<ProjectSummary | null>(null);

    function handleStatusChange(project: ProjectSummary, status: ProjectStatus) {
        router.patch(
            update(project.id).url,
            { status },
            { preserveScroll: true },
        );
    }

    function renderProjectCard(project: ProjectSummary) {
        return (
            <Card key={project.id} className="overflow-hidden pt-0">
                {project.banner_url && (
                    <img
                        src={project.banner_url}
                        alt=""
                        className="h-32 w-full object-cover"
                    />
                )}
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="min-w-0">
                        <CardTitle className="truncate">
                            <Link
                                href={show(project.id)}
                                className="hover:underline"
                            >
                                {project.name}
                            </Link>
                        </CardTitle>
                        {project.description && (
                            <CardDescription className="line-clamp-2">
                                {project.description}
                            </CardDescription>
                        )}
                    </div>
                    {(project.can.update || project.can.delete) && (
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
                                        onSelect={() => setRenaming(project)}
                                    >
                                        Rename
                                    </DropdownMenuItem>
                                )}
                                {project.can.delete && (
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={() => setDeleting(project)}
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
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

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                        Projects you own or have been given access to.
                    </p>

                    {can.create && (
                        <NewProjectSheet assignableUsers={assignableUsers} />
                    )}
                </div>

                {projects.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center">
                        <FolderKanban className="text-muted-foreground size-8" />
                        <p className="text-muted-foreground text-sm">
                            No projects yet. Create one to get started.
                        </p>
                    </div>
                ) : (
                    <Tabs defaultValue="ongoing" className="gap-4">
                        <TabsList>
                            {PROJECT_STATUSES.map((status) => {
                                const count = projects.filter(
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
                            const filtered = projects.filter(
                                (p) => p.status === status.value,
                            );

                            return (
                                <TabsContent
                                    key={status.value}
                                    value={status.value}
                                >
                                    {filtered.length === 0 ? (
                                        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center">
                                            <FolderKanban className="text-muted-foreground size-8" />
                                            <p className="text-muted-foreground text-sm">
                                                No {status.label.toLowerCase()}{' '}
                                                projects.
                                            </p>
                                        </div>
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

            <Dialog
                open={renaming !== null}
                onOpenChange={(open) => !open && setRenaming(null)}
            >
                <DialogContent>
                    <DialogTitle>Rename project</DialogTitle>
                    {renaming && (
                        <Form
                            {...update.form(renaming.id)}
                            method="patch"
                            onSuccess={() => setRenaming(null)}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="rename-project-name">
                                            Name
                                        </Label>
                                        <Input
                                            id="rename-project-name"
                                            name="name"
                                            defaultValue={renaming.name}
                                            autoFocus
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="rename-project-description">
                                            Description
                                        </Label>
                                        <Input
                                            id="rename-project-description"
                                            name="description"
                                            defaultValue={
                                                renaming.description ?? ''
                                            }
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="secondary">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing && <Spinner />}
                                            Save
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

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
