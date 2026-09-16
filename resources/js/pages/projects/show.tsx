import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    Download,
    Folder as FolderIcon,
    LayoutGrid,
    List,
    MoreHorizontal,
    Pencil,
} from 'lucide-react';
import { pickGradient } from '@/components/card-folder';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { EmptyState } from '@/components/empty-state';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { FileDropZone } from '@/components/projects/file-drop-zone';
import { FolderBreadcrumb } from '@/components/projects/folder-breadcrumb';
import { NewFolderDialog } from '@/components/projects/new-folder-dialog';
import { PhaseCollaborationPanel } from '@/components/projects/phase-collaboration-panel';
import { ProjectPhases } from '@/components/projects/project-phases';
import { RenameMoveDialog } from '@/components/projects/rename-move-dialog';
import { ShareProjectDialog } from '@/components/projects/share-project-dialog';
import { UploadFileDialog } from '@/components/projects/upload-file-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { bannerImageStyle } from '@/lib/banner-style';
import { fileIconFor, formatBytes } from '@/lib/file-display';
import { index, show } from '@/routes/projects';
import { destroy as destroyFile, download } from '@/routes/projects/files';
import { destroy as destroyFolder } from '@/routes/projects/folders';
import type {
    PhaseActivitySummary,
    ProjectDetail,
    ProjectFileSummary,
    ProjectFolderSummary,
    ProjectPhaseSummary,
    TaggableMember,
} from '@/types';

type EditingItem = {
    kind: 'folder' | 'file';
    id: number;
    name: string;
    folderId: number | null;
};

function TileActions({
    label,
    canEdit,
    canDelete,
    onEdit,
    onDelete,
    extra,
}: {
    label: string;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: () => void;
    onDelete: () => void;
    extra?: ReactNode;
}) {
    if (!extra && !canEdit && !canDelete) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground absolute top-1.5 right-1.5 rounded-full opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-transparent data-[state=open]:opacity-100"
                >
                    <MoreHorizontal className="size-3.5" />
                    <span className="sr-only">{label} actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {extra}
                {canEdit && (
                    <DropdownMenuItem onSelect={onEdit}>
                        Rename / Move
                    </DropdownMenuItem>
                )}
                {canDelete && (
                    <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                        Delete
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function FolderTile({
    folder,
    href,
    canEdit,
    canDelete,
    onEdit,
    onDelete,
}: {
    folder: ProjectFolderSummary;
    href: string;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="group hover:bg-muted/40 relative flex flex-col items-center gap-1 rounded-lg border border-transparent p-1.5 text-center">
            <Link
                href={href}
                className="flex flex-col items-center gap-1 focus-visible:outline-none"
            >
                <FolderIcon
                    className="text-muted-foreground size-12 shrink-0"
                    strokeWidth={1.25}
                />
                <span className="line-clamp-2 w-full text-xs font-medium break-words">
                    {folder.name}
                </span>
            </Link>

            <TileActions
                label="Folder"
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </div>
    );
}

function FileTile({
    projectId,
    file,
    onEdit,
    onDelete,
}: {
    projectId: number;
    file: ProjectFileSummary;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const Icon = fileIconFor(file.mime_type);

    return (
        <div className="group hover:bg-muted/40 relative flex flex-col items-center gap-1 rounded-lg border border-transparent p-1.5 text-center">
            <div className="flex flex-col items-center gap-1">
                <Icon
                    className="text-muted-foreground size-12 shrink-0"
                    strokeWidth={1.25}
                />
                <span
                    className="line-clamp-2 w-full text-xs font-medium break-words"
                    title={file.name}
                >
                    {file.name}
                </span>
            </div>

            <TileActions
                label="File"
                canEdit={file.can.edit}
                canDelete={file.can.delete}
                onEdit={onEdit}
                onDelete={onDelete}
                extra={
                    <DropdownMenuItem asChild>
                        <a href={download([projectId, file.id]).url}>
                            <Download className="size-4" />
                            Download
                        </a>
                    </DropdownMenuItem>
                }
            />
        </div>
    );
}

export default function Show({
    project,
    view,
    currentFolder,
    breadcrumbTrail,
    folders,
    files,
    phases,
    availablePhaseTemplates,
    teams,
    activePhaseId,
    activities,
    taggableMembers,
}: {
    project: ProjectDetail;
    view: 'grid' | 'list';
    currentFolder: ProjectFolderSummary | null;
    breadcrumbTrail: ProjectFolderSummary[];
    folders: ProjectFolderSummary[];
    files: ProjectFileSummary[];
    phases: ProjectPhaseSummary[];
    availablePhaseTemplates: { id: number; name: string }[];
    teams: { id: number; name: string }[];
    activePhaseId: number | null;
    activities: PhaseActivitySummary[];
    taggableMembers: TaggableMember[];
}) {
    const [editing, setEditing] = useState<EditingItem | null>(null);
    const [deleting, setDeleting] = useState<EditingItem | null>(null);
    const [editingProject, setEditingProject] = useState(false);

    const currentFolderId = currentFolder?.id ?? null;
    const coverGradient = pickGradient(project.id);
    const activePhaseIndex = phases.findIndex((p) => p.id === activePhaseId);
    const activePhase =
        activePhaseIndex === -1 ? null : phases[activePhaseIndex];
    const nextPhaseName =
        activePhaseIndex === -1
            ? null
            : (phases[activePhaseIndex + 1]?.name ?? null);

    /**
     * Builds the show() URL, defaulting every dimension (view, folder,
     * open collaboration panel) to its current value unless explicitly
     * overridden - so switching views, navigating folders, or opening/
     * closing the panel never accidentally drops one of the others.
     */
    function buildShowUrl(
        overrides: {
            view?: 'grid' | 'list';
            folder?: number | null;
            panel?: number | null;
        } = {},
    ): string {
        const nextView = overrides.view ?? view;
        const nextFolder =
            'folder' in overrides ? overrides.folder : currentFolderId;
        const nextPanel =
            'panel' in overrides ? overrides.panel : activePhaseId;

        const params = new URLSearchParams();
        params.set('view', nextView);
        if (nextFolder) {
            params.set('folder', String(nextFolder));
        }
        if (nextPanel) {
            params.set('panel', String(nextPanel));
        }

        return `${show(project.id).url}?${params.toString()}`;
    }

    function switchView(nextView: 'grid' | 'list') {
        router.get(
            buildShowUrl({ view: nextView }),
            {},
            { preserveScroll: true },
        );
    }

    function openPhasePanel(phaseId: number) {
        router.get(
            buildShowUrl({ panel: phaseId }),
            {},
            { preserveScroll: true, preserveState: true },
        );
    }

    function closePhasePanel() {
        router.get(
            buildShowUrl({ panel: null }),
            {},
            { preserveScroll: true, preserveState: true },
        );
    }

    const deleteFormProps =
        deleting?.kind === 'folder'
            ? destroyFolder.form([project.id, deleting.id])
            : deleting
              ? destroyFile.form([project.id, deleting.id])
              : null;

    return (
        <>
            <Head title={project.name} />

            <div className="flex min-w-0 flex-1">
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-[min(var(--radius-4xl),24px)] sm:h-48 lg:h-56">
                        {project.banner_url ? (
                            <img
                                src={project.banner_url}
                                alt=""
                                className="h-full w-full object-cover"
                                style={bannerImageStyle(
                                    project.banner_focal_x,
                                    project.banner_focal_y,
                                    project.banner_zoom,
                                )}
                            />
                        ) : (
                            <div
                                className={`h-full w-full bg-linear-to-br ${coverGradient}`}
                            />
                        )}

                        {/* Subtle fade into the project info below, echoing the folder-card seam */}
                        <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t" />
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="font-heading text-2xl font-semibold tracking-tight">
                                {project.name}
                            </h1>
                            {project.description && (
                                <p className="text-muted-foreground text-sm">
                                    {project.description}
                                </p>
                            )}
                            {(project.client_name ||
                                project.site_address ||
                                project.start_date) && (
                                <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                    {project.client_name && (
                                        <span>
                                            Client: {project.client_name}
                                        </span>
                                    )}
                                    {project.site_address && (
                                        <>
                                            {project.client_name && (
                                                <span>&middot;</span>
                                            )}
                                            <span>{project.site_address}</span>
                                        </>
                                    )}
                                    {project.start_date && (
                                        <>
                                            {(project.client_name ||
                                                project.site_address) && (
                                                <span>&middot;</span>
                                            )}
                                            <span>
                                                {project.start_date}
                                                {project.end_date &&
                                                    ` – ${project.end_date}`}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {project.can.update && (
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingProject(true)}
                                >
                                    <Pencil className="size-4" />
                                    Edit
                                </Button>
                            )}
                            <ShareProjectDialog
                                projectId={project.id}
                                members={project.members}
                                canManage={project.can.manageMembers}
                            />
                        </div>
                    </div>

                    <ProjectPhases
                        projectId={project.id}
                        phases={phases}
                        availablePhaseTemplates={availablePhaseTemplates}
                        teams={teams}
                        canManage={project.can.managePhases}
                        activePhaseId={activePhaseId}
                        onOpenPhase={openPhasePanel}
                        onClosePhase={closePhasePanel}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <FolderBreadcrumb
                            projectId={project.id}
                            view={view}
                            trail={breadcrumbTrail}
                            activePhaseId={activePhaseId}
                        />

                        <div className="flex items-center gap-2">
                            <Tabs
                                value={view}
                                onValueChange={(v) =>
                                    switchView(v as 'grid' | 'list')
                                }
                            >
                                <TabsList>
                                    <TabsTrigger value="list">
                                        <List className="size-4" />
                                        <span className="sr-only">
                                            List view
                                        </span>
                                    </TabsTrigger>
                                    <TabsTrigger value="grid">
                                        <LayoutGrid className="size-4" />
                                        <span className="sr-only">
                                            Grid view
                                        </span>
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {project.can.createFolders && (
                                <NewFolderDialog
                                    projectId={project.id}
                                    parentId={currentFolderId}
                                />
                            )}
                            {project.can.uploadFiles && (
                                <UploadFileDialog
                                    projectId={project.id}
                                    folderId={currentFolderId}
                                />
                            )}
                        </div>
                    </div>

                    <FileDropZone
                        projectId={project.id}
                        folderId={currentFolderId}
                        disabled={!project.can.uploadFiles}
                    >
                        {folders.length === 0 && files.length === 0 ? (
                            <EmptyState
                                icon={FolderIcon}
                                message="This folder is empty."
                            />
                        ) : view === 'grid' ? (
                            <div className="grid grid-cols-4 gap-x-1 gap-y-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
                                {folders.map((folder) => (
                                    <FolderTile
                                        key={`folder-${folder.id}`}
                                        folder={folder}
                                        href={buildShowUrl({
                                            folder: folder.id,
                                        })}
                                        canEdit={project.can.editItems}
                                        canDelete={project.can.deleteItems}
                                        onEdit={() =>
                                            setEditing({
                                                kind: 'folder',
                                                id: folder.id,
                                                name: folder.name,
                                                folderId: currentFolderId,
                                            })
                                        }
                                        onDelete={() =>
                                            setDeleting({
                                                kind: 'folder',
                                                id: folder.id,
                                                name: folder.name,
                                                folderId: currentFolderId,
                                            })
                                        }
                                    />
                                ))}

                                {files.map((file) => (
                                    <FileTile
                                        key={`file-${file.id}`}
                                        projectId={project.id}
                                        file={file}
                                        onEdit={() =>
                                            setEditing({
                                                kind: 'file',
                                                id: file.id,
                                                name: file.name,
                                                folderId: currentFolderId,
                                            })
                                        }
                                        onDelete={() =>
                                            setDeleting({
                                                kind: 'file',
                                                id: file.id,
                                                name: file.name,
                                                folderId: null,
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Uploaded by</TableHead>
                                        <TableHead className="w-10" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {folders.map((folder) => (
                                        <TableRow key={`folder-${folder.id}`}>
                                            <TableCell colSpan={1}>
                                                <Link
                                                    href={buildShowUrl({
                                                        folder: folder.id,
                                                    })}
                                                    className="flex items-center gap-2.5 font-medium hover:underline"
                                                >
                                                    <FolderIcon
                                                        className="text-muted-foreground size-5 shrink-0"
                                                        strokeWidth={1.5}
                                                    />
                                                    {folder.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {folder.size > 0
                                                    ? formatBytes(folder.size)
                                                    : '—'}
                                            </TableCell>
                                            <TableCell />
                                            <TableCell>
                                                {(project.can.editItems ||
                                                    project.can
                                                        .deleteItems) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                            >
                                                                <MoreHorizontal className="size-4" />
                                                                <span className="sr-only">
                                                                    Folder
                                                                    actions
                                                                </span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {project.can
                                                                .editItems && (
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        setEditing(
                                                                            {
                                                                                kind: 'folder',
                                                                                id: folder.id,
                                                                                name: folder.name,
                                                                                folderId:
                                                                                    currentFolderId,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    Rename /
                                                                    Move
                                                                </DropdownMenuItem>
                                                            )}
                                                            {project.can
                                                                .deleteItems && (
                                                                <DropdownMenuItem
                                                                    variant="destructive"
                                                                    onSelect={() =>
                                                                        setDeleting(
                                                                            {
                                                                                kind: 'folder',
                                                                                id: folder.id,
                                                                                name: folder.name,
                                                                                folderId:
                                                                                    currentFolderId,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {files.map((file) => {
                                        const FileIcon = fileIconFor(
                                            file.mime_type,
                                        );

                                        return (
                                            <TableRow key={`file-${file.id}`}>
                                                <TableCell className="font-medium">
                                                    <span className="flex items-center gap-2.5">
                                                        <FileIcon
                                                            className="text-muted-foreground size-5 shrink-0"
                                                            strokeWidth={1.5}
                                                        />
                                                        {file.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatBytes(file.size)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {file.uploaded_by.name}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                            >
                                                                <MoreHorizontal className="size-4" />
                                                                <span className="sr-only">
                                                                    File actions
                                                                </span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                asChild
                                                            >
                                                                <a
                                                                    href={
                                                                        download(
                                                                            [
                                                                                project.id,
                                                                                file.id,
                                                                            ],
                                                                        ).url
                                                                    }
                                                                >
                                                                    <Download className="size-4" />
                                                                    Download
                                                                </a>
                                                            </DropdownMenuItem>
                                                            {file.can.edit && (
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        setEditing(
                                                                            {
                                                                                kind: 'file',
                                                                                id: file.id,
                                                                                name: file.name,
                                                                                folderId:
                                                                                    currentFolderId,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    Rename /
                                                                    Move
                                                                </DropdownMenuItem>
                                                            )}
                                                            {file.can
                                                                .delete && (
                                                                <DropdownMenuItem
                                                                    variant="destructive"
                                                                    onSelect={() =>
                                                                        setDeleting(
                                                                            {
                                                                                kind: 'file',
                                                                                id: file.id,
                                                                                name: file.name,
                                                                                folderId:
                                                                                    null,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </FileDropZone>
                </div>

                <PhaseCollaborationPanel
                    projectId={project.id}
                    phase={activePhase}
                    activities={activities}
                    canManage={project.can.managePhases}
                    nextPhaseName={nextPhaseName}
                    projectMembers={taggableMembers}
                    onClose={closePhasePanel}
                />
            </div>

            <EditProjectDialog
                project={editingProject ? project : null}
                onOpenChange={setEditingProject}
            />

            {editing && (
                <RenameMoveDialog
                    kind={editing.kind}
                    open
                    onOpenChange={(open) => !open && setEditing(null)}
                    projectId={project.id}
                    itemId={editing.id}
                    currentName={editing.name}
                    currentFolderId={editing.folderId}
                    siblingFolders={folders}
                />
            )}

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.kind === 'folder' ? 'folder' : 'file'}?`}
                description={
                    deleting?.kind === 'folder' ? (
                        <>
                            This permanently deletes{' '}
                            <span className="text-foreground font-medium">
                                {deleting?.name}
                            </span>{' '}
                            and everything inside it. This cannot be undone.
                        </>
                    ) : (
                        <>
                            This permanently deletes{' '}
                            <span className="text-foreground font-medium">
                                {deleting?.name}
                            </span>
                            . This cannot be undone.
                        </>
                    )
                }
                formAction={deleteFormProps ?? undefined}
                onSuccess={() => setDeleting(null)}
            />
        </>
    );
}

Show.layout = (page: unknown) => {
    // Inertia calls this twice with different shapes: first with the raw
    // page props (to probe whether it returns an element), then with the
    // actual child element to render - handle both so neither call throws.
    const props = page as
        | { project?: ProjectDetail; props?: { project?: ProjectDetail } }
        | undefined;
    const project = props?.props?.project ?? props?.project;

    return (
        <AppLayout
            breadcrumbs={
                project
                    ? [
                          { title: 'Projects', href: index() },
                          { title: project.name, href: show(project.id) },
                      ]
                    : [{ title: 'Projects', href: index() }]
            }
        >
            {page as React.ReactNode}
        </AppLayout>
    );
};
