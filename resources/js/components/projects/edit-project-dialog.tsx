import { useForm } from '@inertiajs/react';
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Field } from '@/components/field';
import { BannerAdjuster } from '@/components/projects/banner-adjuster';
import { LocationPicker } from '@/components/projects/location-picker';
import { ProjectTypeSelect } from '@/components/projects/project-type-select';
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
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/projects';
import type { ProjectDetailFields, ProjectType } from '@/types';

type FormData = {
    name: string;
    description: string;
    type: ProjectType | 'none';
    site_area: string;
    latitude: number | null;
    longitude: number | null;
    banner: File | null;
    banner_focal_x: number;
    banner_focal_y: number;
    banner_zoom: number;
    remove_banner: boolean;
};

function formDataFrom(project: ProjectDetailFields): FormData {
    return {
        name: project.name,
        description: project.description ?? '',
        type: project.type ?? 'none',
        site_area: project.site_area === null ? '' : String(project.site_area),
        latitude: project.latitude,
        longitude: project.longitude,
        banner: null,
        banner_focal_x: project.banner_focal_x,
        banner_focal_y: project.banner_focal_y,
        banner_zoom: project.banner_zoom,
        remove_banner: false,
    };
}

export function EditProjectDialog({
    project,
    onOpenChange,
}: {
    project: ProjectDetailFields | null;
    onOpenChange: (open: boolean) => void;
}) {
    const {
        data,
        setData,
        patch,
        processing,
        errors,
        reset,
        clearErrors,
        transform,
    } = useForm<FormData>(
        project
            ? formDataFrom(project)
            : {
                  name: '',
                  description: '',
                  type: 'none',
                  site_area: '',
                  latitude: null,
                  longitude: null,
                  banner: null,
                  banner_focal_x: 50,
                  banner_focal_y: 50,
                  banner_zoom: 1,
                  remove_banner: false,
              },
    );
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    useEffect(() => {
        if (project) {
            clearErrors();
            setData(formDataFrom(project));
            setBannerPreview(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.id]);

    function handleBannerChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setData((prev) => ({
            ...prev,
            banner: file,
            // A fresh crop for a new image; reverting to no file restores
            // whatever adjustment the existing banner already had saved.
            banner_focal_x: file ? 50 : (project?.banner_focal_x ?? 50),
            banner_focal_y: file ? 50 : (project?.banner_focal_y ?? 50),
            banner_zoom: file ? 1 : (project?.banner_zoom ?? 1),
            remove_banner: false,
        }));

        if (!file) {
            setBannerPreview(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setBannerPreview(reader.result as string);
        reader.readAsDataURL(file);
    }

    function handleRemoveBanner() {
        setData((prev) => ({ ...prev, banner: null, remove_banner: true }));
        setBannerPreview(null);
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (!project) {
            return;
        }

        transform((formData) => ({
            ...formData,
            type: formData.type === 'none' ? '' : formData.type,
        }));

        patch(update(project.id).url, {
            forceFormData: true,
            onSuccess: () => {
                onOpenChange(false);
                reset();
                setBannerPreview(null);
            },
        });
    }

    return (
        <Dialog
            open={project !== null}
            onOpenChange={(open) => !open && onOpenChange(false)}
        >
            <DialogContent className="flex max-h-[85vh] w-full flex-col sm:max-w-xl">
                <DialogTitle>Edit project</DialogTitle>
                {project && (
                    <form
                        id="edit-project-form"
                        onSubmit={handleSubmit}
                        className="flex-1 space-y-4 overflow-y-auto pr-1"
                    >
                        <Field
                            htmlFor="edit-project-banner"
                            label="Banner"
                            error={errors.banner}
                        >
                            {(bannerPreview ||
                                (!data.remove_banner &&
                                    project.banner_url)) && (
                                <BannerAdjuster
                                    imageUrl={
                                        (bannerPreview ??
                                            project.banner_url) as string
                                    }
                                    focalX={data.banner_focal_x}
                                    focalY={data.banner_focal_y}
                                    zoom={data.banner_zoom}
                                    onChange={(focalX, focalY, zoom) =>
                                        setData((prev) => ({
                                            ...prev,
                                            banner_focal_x: focalX,
                                            banner_focal_y: focalY,
                                            banner_zoom: zoom,
                                        }))
                                    }
                                />
                            )}
                            <div className="flex items-center gap-2">
                                <Input
                                    id="edit-project-banner"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBannerChange}
                                    className="flex-1"
                                />
                                {(project.banner_url || bannerPreview) &&
                                    !data.remove_banner && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleRemoveBanner}
                                        >
                                            Remove
                                        </Button>
                                    )}
                            </div>
                        </Field>
                        <Field
                            htmlFor="edit-project-name"
                            label="Name"
                            required
                            error={errors.name}
                        >
                            <Input
                                id="edit-project-name"
                                placeholder="Harborview Residence"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                autoFocus
                                required
                            />
                        </Field>
                        <Field
                            htmlFor="edit-project-description"
                            label="Description"
                            error={errors.description}
                        >
                            <Input
                                id="edit-project-description"
                                placeholder="A short summary of the project…"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                htmlFor="edit-project-type"
                                label="Type"
                                error={errors.type}
                            >
                                <ProjectTypeSelect
                                    value={data.type}
                                    onValueChange={(type) =>
                                        setData('type', type)
                                    }
                                />
                            </Field>
                            <Field
                                htmlFor="edit-project-site-area"
                                label="Site area (sq ft)"
                                error={errors.site_area}
                            >
                                <Input
                                    id="edit-project-site-area"
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="3,200"
                                    value={data.site_area}
                                    onChange={(e) =>
                                        setData('site_area', e.target.value)
                                    }
                                />
                            </Field>
                        </div>
                        <div className="grid gap-2">
                            <Label>Pin location (optional)</Label>
                            <LocationPicker
                                latitude={data.latitude}
                                longitude={data.longitude}
                                onChange={(latitude, longitude) => {
                                    setData('latitude', latitude);
                                    setData('longitude', longitude);
                                }}
                            />
                            <InputError message={errors.latitude} />
                            <InputError message={errors.longitude} />
                        </div>
                    </form>
                )}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="edit-project-form"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
