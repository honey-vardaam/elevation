import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { MoreHorizontal, Quote } from 'lucide-react';
import { Field } from '@/components/field';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { destroy, store, update } from '@/routes/portfolio-testimonials';
import type { PortfolioTestimonial } from '@/types';

export function TestimonialManager({
    portfolioId,
    testimonials,
}: {
    portfolioId: number;
    testimonials: PortfolioTestimonial[];
}) {
    const [editing, setEditing] = useState<PortfolioTestimonial | null>(null);
    const [adding, setAdding] = useState(false);

    function remove(testimonial: PortfolioTestimonial) {
        router.delete(destroy([portfolioId, testimonial.id]).url, {
            preserveScroll: true,
        });
    }

    return (
        <div className="space-y-3">
            {testimonials.map((testimonial) => (
                <div
                    key={testimonial.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                >
                    <Avatar>
                        {testimonial.photo_url && (
                            <AvatarImage src={testimonial.photo_url} />
                        )}
                        <AvatarFallback>
                            {testimonial.author_name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">
                                {testimonial.author_name}
                            </p>
                            {testimonial.author_role && (
                                <p className="text-muted-foreground truncate text-xs">
                                    {testimonial.author_role}
                                </p>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                            <Quote className="mr-1 inline size-3" />
                            {testimonial.quote}
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onSelect={() => setEditing(testimonial)}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => remove(testimonial)}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={() => setAdding(true)}
            >
                Add testimonial
            </Button>

            <TestimonialFormDialog
                portfolioId={portfolioId}
                testimonial={editing}
                open={editing !== null}
                onOpenChange={(open) => !open && setEditing(null)}
            />
            <TestimonialFormDialog
                portfolioId={portfolioId}
                testimonial={null}
                open={adding}
                onOpenChange={setAdding}
            />
        </div>
    );
}

function TestimonialFormDialog({
    portfolioId,
    testimonial,
    open,
    onOpenChange,
}: {
    portfolioId: number;
    testimonial: PortfolioTestimonial | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const isEditing = testimonial !== null;
    const { data, setData, post, patch, processing, errors, reset } = useForm<{
        author_name: string;
        author_role: string;
        quote: string;
        photo: File | null;
    }>({
        author_name: testimonial?.author_name ?? '',
        author_role: testimonial?.author_role ?? '',
        quote: testimonial?.quote ?? '',
        photo: null,
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const onSuccess = () => {
            onOpenChange(false);
            reset();
        };

        if (isEditing && testimonial) {
            patch(update([portfolioId, testimonial.id]).url, {
                forceFormData: true,
                onSuccess,
            });
        } else {
            post(store(portfolioId).url, {
                forceFormData: true,
                onSuccess,
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>
                    {isEditing ? 'Edit testimonial' : 'Add testimonial'}
                </DialogTitle>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Field
                            htmlFor="testimonial-author"
                            label="Name"
                            required
                            error={errors.author_name}
                        >
                            <Input
                                id="testimonial-author"
                                value={data.author_name}
                                onChange={(e) =>
                                    setData('author_name', e.target.value)
                                }
                                autoFocus
                                required
                            />
                        </Field>
                        <Field
                            htmlFor="testimonial-role"
                            label="Role (optional)"
                            error={errors.author_role}
                        >
                            <Input
                                id="testimonial-role"
                                value={data.author_role}
                                onChange={(e) =>
                                    setData('author_role', e.target.value)
                                }
                            />
                        </Field>
                    </div>
                    <Field
                        htmlFor="testimonial-quote"
                        label="Quote"
                        required
                        error={errors.quote}
                    >
                        <Textarea
                            id="testimonial-quote"
                            rows={4}
                            value={data.quote}
                            onChange={(e) => setData('quote', e.target.value)}
                            required
                        />
                    </Field>
                    <Field
                        htmlFor="testimonial-photo"
                        label="Photo (optional)"
                        error={errors.photo}
                    >
                        <Input
                            id="testimonial-photo"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData('photo', e.target.files?.[0] ?? null)
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
            </DialogContent>
        </Dialog>
    );
}
