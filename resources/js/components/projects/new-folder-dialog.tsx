import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { store } from '@/routes/projects/folders';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';

export function NewFolderDialog({
    projectId,
    parentId,
}: {
    projectId: number;
    parentId: number | null;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">New Folder</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>New folder</DialogTitle>

                <Form
                    {...store.form(projectId)}
                    onSuccess={() => setOpen(false)}
                    resetOnSuccess
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="folder-name">Name</Label>
                                <Input
                                    id="folder-name"
                                    name="name"
                                    autoFocus
                                    required
                                    placeholder="e.g. Site Specification"
                                />
                                <InputError message={errors.name} />
                            </div>

                            {parentId !== null && (
                                <input
                                    type="hidden"
                                    name="parent_id"
                                    value={parentId}
                                />
                            )}

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create folder
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
