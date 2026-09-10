import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { store } from '@/routes/projects/files';
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

export function UploadFileDialog({
    projectId,
    folderId,
}: {
    projectId: number;
    folderId: number | null;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Upload File</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Upload file</DialogTitle>

                <Form
                    {...store.form(projectId)}
                    onSuccess={() => setOpen(false)}
                    resetOnSuccess
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="upload-file">File</Label>
                                <Input
                                    id="upload-file"
                                    name="file"
                                    type="file"
                                    required
                                />
                                <InputError message={errors.file} />
                            </div>

                            {folderId !== null && (
                                <input
                                    type="hidden"
                                    name="folder_id"
                                    value={folderId}
                                />
                            )}

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Upload
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
