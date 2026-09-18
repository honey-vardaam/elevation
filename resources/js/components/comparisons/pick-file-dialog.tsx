import { useMemo, useState } from 'react';
import { FileSearch, Search } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { fileIconFor, formatBytes } from '@/lib/file-display';
import type { ComparisonFileSummary } from '@/types';

export function PickFileDialog({
    open,
    onOpenChange,
    files,
    title,
    onPick,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    files: ComparisonFileSummary[];
    title: string;
    onPick: (fileId: number) => void;
}) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q
            ? files.filter((file) => file.name.toLowerCase().includes(q))
            : files;
    }, [files, query]);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                onOpenChange(next);
                if (!next) setQuery('');
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    Choose a file already in this project.
                </DialogDescription>

                <div className="relative">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search files…"
                        className="pl-8"
                        autoFocus
                    />
                </div>

                <div className="max-h-80 space-y-0.5 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <EmptyState
                            icon={FileSearch}
                            message="No matching files."
                        />
                    ) : (
                        filtered.map((file) => {
                            const Icon = fileIconFor(file.mime_type);

                            return (
                                <button
                                    key={file.id}
                                    type="button"
                                    onClick={() => {
                                        onPick(file.id);
                                        onOpenChange(false);
                                        setQuery('');
                                    }}
                                    className="hover:bg-muted/60 flex w-full items-center gap-3 rounded-lg p-2 text-left"
                                >
                                    <Icon
                                        className="text-muted-foreground size-8 shrink-0"
                                        strokeWidth={1.25}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {file.name}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {formatBytes(file.size)} ·{' '}
                                            {file.uploaded_by.name}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
