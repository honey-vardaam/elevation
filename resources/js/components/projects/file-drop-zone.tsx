import { router } from '@inertiajs/react';
import {
    type DragEvent,
    type ReactNode,
    useCallback,
    useRef,
    useState,
} from 'react';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/projects/files';

export function FileDropZone({
    projectId,
    folderId,
    disabled,
    children,
}: {
    projectId: number;
    folderId: number | null;
    disabled?: boolean;
    children: ReactNode;
}) {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const dragDepth = useRef(0);

    const uploadNext = useCallback(
        (files: File[]) => {
            const [next, ...rest] = files;

            if (!next) {
                setUploading(false);
                return;
            }

            const formData = new FormData();
            formData.append('file', next);
            if (folderId !== null) {
                formData.append('folder_id', String(folderId));
            }

            router.post(store(projectId).url, formData, {
                forceFormData: true,
                preserveScroll: true,
                preserveState: true,
                onError: (errors) => {
                    toast.error(
                        `${next.name}: ${Object.values(errors)[0] ?? 'Upload failed.'}`,
                    );
                },
                onFinish: () => uploadNext(rest),
            });
        },
        [projectId, folderId],
    );

    function handleDragEnter(event: DragEvent) {
        if (disabled || !event.dataTransfer.types.includes('Files')) {
            return;
        }

        event.preventDefault();
        dragDepth.current += 1;
        setIsDraggingOver(true);
    }

    function handleDragOver(event: DragEvent) {
        if (disabled || !event.dataTransfer.types.includes('Files')) {
            return;
        }

        event.preventDefault();
    }

    function handleDragLeave(event: DragEvent) {
        if (disabled) {
            return;
        }

        event.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) {
            setIsDraggingOver(false);
        }
    }

    function handleDrop(event: DragEvent) {
        if (disabled) {
            return;
        }

        event.preventDefault();
        dragDepth.current = 0;
        setIsDraggingOver(false);

        const files = Array.from(event.dataTransfer.files);
        if (files.length === 0) {
            return;
        }

        setUploading(true);
        uploadNext(files);
    }

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative"
        >
            {children}

            {isDraggingOver && !disabled && (
                <div className="border-primary bg-primary/5 pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed">
                    <UploadCloud className="text-primary size-8" />
                    <p className="text-primary text-sm font-medium">
                        Drop files to upload
                    </p>
                </div>
            )}

            {uploading && (
                <div className="bg-background text-muted-foreground absolute top-2 right-2 z-10 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs shadow-sm">
                    <Spinner />
                    Uploading...
                </div>
            )}
        </div>
    );
}
