import { useForm } from '@inertiajs/react';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/portfolios';
import type { PortfolioDetail } from '@/types';

export function HeroEditor({ portfolio }: { portfolio: PortfolioDetail }) {
    const [preview, setPreview] = useState<string | null>(portfolio.hero_url);
    const { data, setData, patch, processing, errors } = useForm({
        title: portfolio.title ?? '',
        intro: portfolio.intro ?? '',
        hero_image: null as File | null,
        is_published: portfolio.is_published,
    });

    function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setData('hero_image', file);

        if (!file) {
            setPreview(portfolio.hero_url);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        patch(update(portfolio.id).url, { preserveScroll: true });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                    {portfolio.year} Portfolio
                </h2>
                <Badge variant={portfolio.is_published ? 'default' : 'secondary'}>
                    {portfolio.is_published ? 'Published' : 'Draft'}
                </Badge>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="hero-image">Hero image</Label>
                {preview && (
                    <img
                        src={preview}
                        alt=""
                        className="h-48 w-full rounded-lg object-cover"
                    />
                )}
                <Input
                    id="hero-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                />
                <InputError message={errors.hero_image} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="portfolio-title">Title</Label>
                <Input
                    id="portfolio-title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                />
                <InputError message={errors.title} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="portfolio-intro">Intro</Label>
                <Textarea
                    id="portfolio-intro"
                    rows={3}
                    value={data.intro}
                    onChange={(e) => setData('intro', e.target.value)}
                />
                <InputError message={errors.intro} />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Checkbox
                        id="is-published"
                        checked={data.is_published}
                        onCheckedChange={(checked) =>
                            setData('is_published', checked === true)
                        }
                    />
                    <Label htmlFor="is-published">
                        Published (visible at the public link)
                    </Label>
                </div>
                <Button type="submit" disabled={processing}>
                    {processing && <Spinner />}
                    Save
                </Button>
            </div>
        </form>
    );
}
