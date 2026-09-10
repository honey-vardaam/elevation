import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { update as updateFile } from '@/routes/projects/files';
import { update as updateFolder } from '@/routes/projects/folders';
import type { ProjectFolderSummary } from '@/types';

const ROOT_SENTINEL = '__root__';

type Props = {
    kind: 'folder' | 'file';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: number;
    itemId: number;
    currentName: string;
    currentFolderId: number | null;
    siblingFolders: ProjectFolderSummary[];
};

export function RenameMoveDialog({
    kind,
    open,
    onOpenChange,
    projectId,
    itemId,
    currentName,
    currentFolderId,
    siblingFolders,
}: Props) {
    const formProps =
        kind === 'folder'
            ? updateFolder.form([projectId, itemId])
            : updateFile.form([projectId, itemId]);

    const folderOptions = siblingFolders.filter(
        (folder) => !(kind === 'folder' && folder.id === itemId),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>
                    Rename or move {kind === 'folder' ? 'folder' : 'file'}
                </DialogTitle>

                <Form
                    {...formProps}
                    method="patch"
                    transform={(data) => ({
                        ...data,
                        folder_id:
                            data.folder_id === ROOT_SENTINEL
                                ? null
                                : data.folder_id,
                    })}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="item-name">Name</Label>
                                <Input
                                    id="item-name"
                                    name="name"
                                    defaultValue={currentName}
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="item-folder">Folder</Label>
                                <Select
                                    name="folder_id"
                                    defaultValue={
                                        currentFolderId?.toString() ??
                                        ROOT_SENTINEL
                                    }
                                >
                                    <SelectTrigger
                                        id="item-folder"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ROOT_SENTINEL}>
                                            No folder (project root)
                                        </SelectItem>
                                        {folderOptions.map((folder) => (
                                            <SelectItem
                                                key={folder.id}
                                                value={folder.id.toString()}
                                            >
                                                {folder.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.folder_id} />
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
