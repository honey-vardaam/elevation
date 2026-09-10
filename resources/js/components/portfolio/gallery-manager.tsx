import { router, useForm } from '@inertiajs/react';
import { type ChangeEvent } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { destroy, reorder, store } from '@/routes/portfolio-photos';
import type { PortfolioPhoto } from '@/types';

export function GalleryManager({
    portfolioId,
    photos,
}: {
    portfolioId: number;
    photos: PortfolioPhoto[];
}) {
    const { post, processing, transform, reset } = useForm<{
        photo: File | null;
    }>({ photo: null });

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        if (!file) {
            return;
        }

        transform(() => ({ photo: file }));
        post(store(portfolioId).url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    function move(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= photos.length) {
            return;
        }

        const ids = photos.map((p) => p.id);
        [ids[index], ids[target]] = [ids[target], ids[index]];

        router.post(
            reorder(portfolioId).url,
            { ids },
            { preserveScroll: true },
        );
    }

    function remove(photo: PortfolioPhoto) {
        router.delete(destroy([portfolioId, photo.id]).url, {
            preserveScroll: true,
        });
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo, index) => (
                    <div
                        key={photo.id}
                        className="group relative overflow-hidden rounded-lg border"
                    >
                        <img
                            src={photo.url}
                            alt={photo.caption ?? ''}
                            className="aspect-square w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => move(index, -1)}
                                className="text-white disabled:opacity-30"
                            >
                                <ArrowLeft className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => remove(photo)}
                                className="text-white hover:text-destructive"
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                disabled={index === photos.length - 1}
                                onClick={() => move(index, 1)}
                                className="text-white disabled:opacity-30"
                            >
                                <ArrowRight className="size-3.5" />
                            </button>
                        </div>
                    </div>
                ))}

                <label
                    htmlFor="gallery-upload"
                    className="text-muted-foreground hover:border-foreground/40 hover:text-foreground flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs"
                >
                    {processing ? (
                        <Spinner />
                    ) : (
                        <>
                            <ImagePlus className="size-5" />
                            Add photo
                        </>
                    )}
                    <Input
                        id="gallery-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={processing}
                    />
                </label>
            </div>
        </div>
    );
}
