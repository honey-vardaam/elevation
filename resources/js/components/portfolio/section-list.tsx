import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { Eye, EyeOff, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Field } from '@/components/field';
import { SortableList } from '@/components/sortable-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { destroy, reorder, store, update } from '@/routes/portfolio-sections';
import type { PortfolioSectionAdmin } from '@/types';

export function SectionList({
    portfolioId,
    sections,
}: {
    portfolioId: number;
    sections: PortfolioSectionAdmin[];
}) {
    const [editing, setEditing] = useState<PortfolioSectionAdmin | null>(null);
    const [adding, setAdding] = useState(false);

    function toggleVisible(section: PortfolioSectionAdmin) {
        router.patch(
            update([portfolioId, section.id]).url,
            {
                title: section.title,
                body: section.body,
                is_visible: !section.is_visible,
            },
            { preserveScroll: true },
        );
    }

    function handleReorder(ids: number[]) {
        router.post(
            reorder(portfolioId).url,
            { ids },
            { preserveScroll: true },
        );
    }

    function removeSection(section: PortfolioSectionAdmin) {
        router.delete(destroy([portfolioId, section.id]).url, {
            preserveScroll: true,
        });
    }

    return (
        <div className="space-y-2">
            <SortableList
                items={sections}
                onReorder={handleReorder}
                className="space-y-2"
                renderItem={(section, _index, { handle, isDragging }) => (
                    <div
                        className={cn(
                            'bg-card flex items-center justify-between gap-3 rounded-lg border p-3 transition-shadow',
                            isDragging && 'shadow-lg',
                        )}
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                ref={handle.ref}
                                {...handle.attributes}
                                {...handle.listeners}
                                className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
                            >
                                <GripVertical className="size-4" />
                                <span className="sr-only">Drag to reorder</span>
                            </button>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {section.title || section.label}
                                </p>
                                {!section.is_visible && (
                                    <Badge
                                        variant="secondary"
                                        className="mt-0.5"
                                    >
                                        Hidden
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            {section.type === 'custom_text' && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setEditing(section)}
                                >
                                    <Pencil className="size-4" />
                                    <span className="sr-only">Edit</span>
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => toggleVisible(section)}
                            >
                                {section.is_visible ? (
                                    <Eye className="size-4" />
                                ) : (
                                    <EyeOff className="size-4" />
                                )}
                                <span className="sr-only">
                                    Toggle visibility
                                </span>
                            </Button>
                            {section.is_deletable && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => removeSection(section)}
                                >
                                    <Trash2 className="size-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            />

            <Button
                type="button"
                variant="outline"
                onClick={() => setAdding(true)}
            >
                Add text section
            </Button>

            <SectionEditDialog
                portfolioId={portfolioId}
                section={editing}
                onOpenChange={(open) => !open && setEditing(null)}
            />
            <AddSectionDialog
                portfolioId={portfolioId}
                open={adding}
                onOpenChange={setAdding}
            />
        </div>
    );
}

function SectionEditDialog({
    portfolioId,
    section,
    onOpenChange,
}: {
    portfolioId: number;
    section: PortfolioSectionAdmin | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { setData, patch, processing, errors, reset } = useForm({
        title: section?.title ?? '',
        body: section?.body ?? '',
        is_visible: section?.is_visible ?? true,
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (!section) {
            return;
        }

        patch(update([portfolioId, section.id]).url, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog
            open={section !== null}
            onOpenChange={(open) => !open && onOpenChange(false)}
        >
            <DialogContent>
                <DialogTitle>Edit section</DialogTitle>
                {section && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field
                            htmlFor="section-title"
                            label="Title"
                            error={errors.title}
                        >
                            <Input
                                id="section-title"
                                defaultValue={section.title ?? ''}
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                                autoFocus
                            />
                        </Field>
                        <Field
                            htmlFor="section-body"
                            label="Text"
                            error={errors.body}
                        >
                            <Textarea
                                id="section-body"
                                rows={5}
                                defaultValue={section.body ?? ''}
                                onChange={(e) =>
                                    setData('body', e.target.value)
                                }
                            />
                        </Field>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={processing}>
                                {processing && <Spinner />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

function AddSectionDialog({
    portfolioId,
    open,
    onOpenChange,
}: {
    portfolioId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        body: '',
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        post(store(portfolioId).url, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Add text section</DialogTitle>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field
                        htmlFor="new-section-title"
                        label="Title"
                        required
                        error={errors.title}
                    >
                        <Input
                            id="new-section-title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            autoFocus
                            required
                        />
                    </Field>
                    <Field
                        htmlFor="new-section-body"
                        label="Text"
                        error={errors.body}
                    >
                        <Textarea
                            id="new-section-body"
                            rows={5}
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                        />
                    </Field>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            Add section
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
