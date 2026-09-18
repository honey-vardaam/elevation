import { router } from '@inertiajs/react';
import {
    type ChangeEvent,
    type DragEvent,
    useEffect,
    useRef,
    useState,
} from 'react';
import { CheckCircle2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { fileIconFor, formatBytes } from '@/lib/file-display';
import { cn } from '@/lib/utils';
import { store } from '@/routes/projects/files';

type QueuedFile = {
    key: string;
    file: File;
    status: 'pending' | 'uploading' | 'done' | 'error';
    error?: string;
};

export function UploadFileDialog({
    projectId,
    folderId,
}: {
    projectId: number;
    folderId: number | null;
}) {
    const [open, setOpen] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [queue, setQueue] = useState<QueuedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [previews, setPreviews] = useState<Record<string, string>>({});
    const inputRef = useRef<HTMLInputElement>(null);

    const imageItems = queue.filter((item) =>
        item.file.type.startsWith('image/'),
    );

    useEffect(() => {
        const next: Record<string, string> = {};
        for (const item of queue) {
            if (item.file.type.startsWith('image/')) {
                next[item.key] = URL.createObjectURL(item.file);
            }
        }

        setPreviews(next);

        return () => {
            Object.values(next).forEach((url) => URL.revokeObjectURL(url));
        };
    }, [queue]);

    function reset() {
        setQueue([]);
        setUploading(false);
        setIsDraggingOver(false);
    }

    function addFiles(files: FileList | File[]) {
        const next = Array.from(files).map((file) => ({
            key: `${file.name}-${file.size}-${file.lastModified}`,
            file,
            status: 'pending' as const,
        }));

        setQueue((current) => [
            ...current,
            ...next.filter((item) => !current.some((c) => c.key === item.key)),
        ]);
    }

    function removeFile(key: string) {
        setQueue((current) => current.filter((item) => item.key !== key));
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files) {
            addFiles(event.target.files);
        }
        event.target.value = '';
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        setIsDraggingOver(false);
        if (event.dataTransfer.files.length > 0) {
            addFiles(event.dataTransfer.files);
        }
    }

    function handleDragOver(event: DragEvent) {
        if (!event.dataTransfer.types.includes('Files')) {
            return;
        }
        event.preventDefault();
        setIsDraggingOver(true);
    }

    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        setIsDraggingOver(false);
    }

    function uploadAll() {
        if (queue.length === 0) {
            return;
        }

        setUploading(true);
        uploadNext(queue.map((item) => item.key));
    }

    function uploadNext(remaining: string[]) {
        const [key, ...rest] = remaining;

        if (!key) {
            setUploading(false);
            setOpen(false);
            reset();
            return;
        }

        const item = queue.find((q) => q.key === key);
        if (!item) {
            uploadNext(rest);
            return;
        }

        setQueue((current) =>
            current.map((q) =>
                q.key === key ? { ...q, status: 'uploading' } : q,
            ),
        );

        const formData = new FormData();
        formData.append('file', item.file);
        if (folderId !== null) {
            formData.append('folder_id', String(folderId));
        }

        router.post(store(projectId).url, formData, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setQueue((current) =>
                    current.map((q) =>
                        q.key === key ? { ...q, status: 'done' } : q,
                    ),
                );
            },
            onError: (errors) => {
                const message = Object.values(errors)[0] ?? 'Upload failed.';

                setQueue((current) =>
                    current.map((q) =>
                        q.key === key
                            ? { ...q, status: 'error', error: message }
                            : q,
                    ),
                );
            },
            onFinish: () => uploadNext(rest),
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!uploading) {
                    setOpen(next);
                    if (!next) reset();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button>Upload File</Button>
            </DialogTrigger>
            <DialogContent
                className={cn(imageItems.length > 0 && 'sm:max-w-2xl')}
            >
                <DialogHeader>
                    <DialogTitle>Upload files</DialogTitle>
                    <DialogDescription>
                        Drag and drop files, or browse from your device. Up to
                        100MB per file.
                    </DialogDescription>
                </DialogHeader>

                <div
                    className={cn(
                        'flex flex-col gap-4',
                        imageItems.length > 0 && 'sm:flex-row',
                    )}
                >
                    <div className="min-w-0 flex-1 space-y-4">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                            className={cn(
                                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
                                isDraggingOver
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-muted/40',
                            )}
                        >
                            <div className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
                                <Upload className="size-5" />
                            </div>
                            <p className="text-sm font-medium">
                                Drag & drop files here, or{' '}
                                <span className="text-primary underline underline-offset-4">
                                    browse
                                </span>
                            </p>
                            <p className="text-muted-foreground text-xs">
                                Supports any file type, up to 100MB each
                            </p>
                            <input
                                ref={inputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleInputChange}
                            />
                        </div>

                        {queue.length > 0 && (
                            <ul className="max-h-56 space-y-1.5 overflow-y-auto">
                                {queue.map((item) => {
                                    const Icon = fileIconFor(
                                        item.file.type || null,
                                    );

                                    return (
                                        <li
                                            key={item.key}
                                            className="bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2"
                                        >
                                            <Icon className="text-muted-foreground size-4 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {item.file.name}
                                                </p>
                                                {item.status === 'error' &&
                                                item.error ? (
                                                    <p className="text-destructive truncate text-xs">
                                                        {item.error}
                                                    </p>
                                                ) : (
                                                    <p className="text-muted-foreground text-xs">
                                                        {formatBytes(
                                                            item.file.size,
                                                        )}
                                                    </p>
                                                )}
                                            </div>

                                            {item.status === 'uploading' && (
                                                <Spinner className="size-4 shrink-0" />
                                            )}
                                            {item.status === 'done' && (
                                                <CheckCircle2 className="text-chart-2 size-4 shrink-0" />
                                            )}
                                            {(item.status === 'pending' ||
                                                item.status === 'error') && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    className={cn(
                                                        'shrink-0',
                                                        item.status ===
                                                            'error' &&
                                                            'text-destructive',
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(item.key);
                                                    }}
                                                >
                                                    <X className="size-3.5" />
                                                    <span className="sr-only">
                                                        Remove
                                                    </span>
                                                </Button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {imageItems.length > 0 && (
                        <div className="sm:w-36 sm:shrink-0">
                            <p className="text-muted-foreground mb-2 text-xs font-medium">
                                Image preview
                            </p>
                            <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-2">
                                {imageItems.map((item) => (
                                    <div
                                        key={item.key}
                                        className="bg-muted relative aspect-square overflow-hidden rounded-lg border"
                                    >
                                        {previews[item.key] && (
                                            <img
                                                src={previews[item.key]}
                                                alt={item.file.name}
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                        {item.status === 'done' && (
                                            <CheckCircle2 className="text-chart-2 absolute top-1 right-1 size-4 rounded-full bg-white/80" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary" disabled={uploading}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        disabled={queue.length === 0 || uploading}
                        onClick={uploadAll}
                    >
                        {uploading && <Spinner />}
                        Upload {queue.length > 0 && `(${queue.length})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
