import { Form, Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Folder as FolderIcon, MoreHorizontal, Download } from 'lucide-react';
import { FolderBreadcrumb } from '@/components/projects/folder-breadcrumb';
import { NewFolderDialog } from '@/components/projects/new-folder-dialog';
import { RenameMoveDialog } from '@/components/projects/rename-move-dialog';
import { ShareProjectDialog } from '@/components/projects/share-project-dialog';
import { UploadFileDialog } from '@/components/projects/upload-file-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Spinner } from '@/components/ui/spinner';
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
import { index, show } from '@/routes/projects';
import { destroy as destroyFile, download } from '@/routes/projects/files';
import { destroy as destroyFolder } from '@/routes/projects/folders';
import type {
    ProjectDetail,
    ProjectFileSummary,
    ProjectFolderSummary,
} from '@/types';

type EditingItem = {
    kind: 'folder' | 'file';
    id: number;
    name: string;
    folderId: number | null;
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export default function Show({
    project,
    view,
    currentFolder,
    breadcrumbTrail,
    folders,
    files,
}: {
    project: ProjectDetail;
    view: 'folder' | 'list';
    currentFolder: ProjectFolderSummary | null;
    breadcrumbTrail: ProjectFolderSummary[];
    folders: ProjectFolderSummary[];
    files: ProjectFileSummary[];
}) {
    const [editing, setEditing] = useState<EditingItem | null>(null);
    const [deleting, setDeleting] = useState<EditingItem | null>(null);

    const currentFolderId = currentFolder?.id ?? null;

    function switchView(nextView: 'folder' | 'list') {
        router.get(
            show(project.id).url,
            nextView === 'folder' && currentFolderId
                ? { view: nextView, folder: currentFolderId }
                : { view: nextView },
            { preserveScroll: true },
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

            <div className="flex flex-1 flex-col gap-6 p-4">
                {project.banner_url && (
                    <img
                        src={project.banner_url}
                        alt=""
                        className="h-48 w-full rounded-xl object-cover"
                    />
                )}

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
                                    <span>Client: {project.client_name}</span>
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
                        <ShareProjectDialog
                            projectId={project.id}
                            members={project.members}
                            canManage={project.can.manageMembers}
                        />
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

                <Tabs
                    value={view}
                    onValueChange={(v) => switchView(v as 'folder' | 'list')}
                >
                    <TabsList>
                        <TabsTrigger value="folder">Folder view</TabsTrigger>
                        <TabsTrigger value="list">List view</TabsTrigger>
                    </TabsList>
                </Tabs>

                {view === 'folder' && (
                    <FolderBreadcrumb
                        projectId={project.id}
                        trail={breadcrumbTrail}
                    />
                )}

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            {view === 'list' && <TableHead>Folder</TableHead>}
                            <TableHead>Size</TableHead>
                            <TableHead>Uploaded by</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {view === 'folder' &&
                            folders.map((folder) => (
                                <TableRow key={`folder-${folder.id}`}>
                                    <TableCell colSpan={1}>
                                        <Link
                                            href={`${show(project.id).url}?view=folder&folder=${folder.id}`}
                                            className="flex items-center gap-2 font-medium hover:underline"
                                        >
                                            <FolderIcon className="text-muted-foreground size-4" />
                                            {folder.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell />
                                    <TableCell />
                                    <TableCell>
                                        {(project.can.editItems ||
                                            project.can.deleteItems) && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                        <span className="sr-only">
                                                            Folder actions
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {project.can.editItems && (
                                                        <DropdownMenuItem
                                                            onSelect={() =>
                                                                setEditing({
                                                                    kind: 'folder',
                                                                    id: folder.id,
                                                                    name: folder.name,
                                                                    folderId:
                                                                        currentFolderId,
                                                                })
                                                            }
                                                        >
                                                            Rename / Move
                                                        </DropdownMenuItem>
                                                    )}
                                                    {project.can
                                                        .deleteItems && (
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onSelect={() =>
                                                                setDeleting({
                                                                    kind: 'folder',
                                                                    id: folder.id,
                                                                    name: folder.name,
                                                                    folderId:
                                                                        currentFolderId,
                                                                })
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

                        {files.map((file) => (
                            <TableRow key={`file-${file.id}`}>
                                <TableCell className="font-medium">
                                    {file.name}
                                </TableCell>
                                {view === 'list' && (
                                    <TableCell>
                                        {file.folder ? (
                                            <Badge variant="outline">
                                                {file.folder.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Root
                                            </span>
                                        )}
                                    </TableCell>
                                )}
                                <TableCell className="text-muted-foreground">
                                    {formatBytes(file.size)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {file.uploaded_by.name}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
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
                                            <DropdownMenuItem asChild>
                                                <a
                                                    href={
                                                        download([
                                                            project.id,
                                                            file.id,
                                                        ]).url
                                                    }
                                                >
                                                    <Download className="size-4" />
                                                    Download
                                                </a>
                                            </DropdownMenuItem>
                                            {file.can.edit && (
                                                <DropdownMenuItem
                                                    onSelect={() =>
                                                        setEditing({
                                                            kind: 'file',
                                                            id: file.id,
                                                            name: file.name,
                                                            folderId:
                                                                file.folder
                                                                    ?.id ??
                                                                null,
                                                        })
                                                    }
                                                >
                                                    Rename / Move
                                                </DropdownMenuItem>
                                            )}
                                            {file.can.delete && (
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onSelect={() =>
                                                        setDeleting({
                                                            kind: 'file',
                                                            id: file.id,
                                                            name: file.name,
                                                            folderId: null,
                                                        })
                                                    }
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}

                        {view === 'folder' &&
                            folders.length === 0 &&
                            files.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-muted-foreground text-center"
                                    >
                                        This folder is empty.
                                    </TableCell>
                                </TableRow>
                            )}

                        {view === 'list' && files.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-muted-foreground text-center"
                                >
                                    No files in this project yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

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

            <Dialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent>
                    <DialogTitle>
                        Delete {deleting?.kind === 'folder' ? 'folder' : 'file'}
                        ?
                    </DialogTitle>
                    <p className="text-muted-foreground text-sm">
                        {deleting?.kind === 'folder' ? (
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
                        )}
                    </p>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        {deleteFormProps && (
                            <Form
                                {...deleteFormProps}
                                onSuccess={() => setDeleting(null)}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        {processing && <Spinner />}
                                        Delete
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
