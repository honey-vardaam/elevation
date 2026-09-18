import { useForm } from '@inertiajs/react';
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Field } from '@/components/field';
import { BannerAdjuster } from '@/components/projects/banner-adjuster';
import { LocationPicker } from '@/components/projects/location-picker';
import { ProjectStatusSelect } from '@/components/projects/project-status-select';
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
import type { ProjectDetailFields, ProjectStatus, ProjectType } from '@/types';

type FormData = {
    name: string;
    description: string;
    status: ProjectStatus;
    type: ProjectType | 'none';
    client_name: string;
    client_email: string;
    client_phone: string;
    site_address: string;
    site_area: string;
    latitude: number | null;
    longitude: number | null;
    start_date: string;
    end_date: string;
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
        status: project.status,
        type: project.type ?? 'none',
        client_name: project.client_name ?? '',
        client_email: project.client_email ?? '',
        client_phone: project.client_phone ?? '',
        site_address: project.site_address ?? '',
        site_area: project.site_area === null ? '' : String(project.site_area),
        latitude: project.latitude,
        longitude: project.longitude,
        start_date: project.start_date ?? '',
        end_date: project.end_date ?? '',
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
                  status: 'ongoing',
                  type: 'none',
                  client_name: '',
                  client_email: '',
                  client_phone: '',
                  site_address: '',
                  site_area: '',
                  latitude: null,
                  longitude: null,
                  start_date: '',
                  end_date: '',
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
            <DialogContent className="flex max-h-[85vh] w-full flex-col sm:max-w-2xl">
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
                                htmlFor="edit-project-status"
                                label="Status"
                                error={errors.status}
                            >
                                <ProjectStatusSelect
                                    value={data.status}
                                    onValueChange={(status) =>
                                        setData('status', status)
                                    }
                                    className="w-full"
                                />
                            </Field>
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
                                    className="w-full"
                                />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                htmlFor="edit-project-start-date"
                                label="Start date"
                                error={errors.start_date}
                            >
                                <Input
                                    id="edit-project-start-date"
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) =>
                                        setData('start_date', e.target.value)
                                    }
                                />
                            </Field>
                            <Field
                                htmlFor="edit-project-end-date"
                                label="End date"
                                error={errors.end_date}
                            >
                                <Input
                                    id="edit-project-end-date"
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) =>
                                        setData('end_date', e.target.value)
                                    }
                                />
                            </Field>
                        </div>
                        <div className="space-y-4">
                            <Label>Client details (optional)</Label>
                            <Field
                                label="Client name"
                                error={errors.client_name}
                            >
                                <Input
                                    aria-label="Client name"
                                    placeholder="The Whitfield Family"
                                    value={data.client_name}
                                    onChange={(e) =>
                                        setData('client_name', e.target.value)
                                    }
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Client email"
                                    error={errors.client_email}
                                >
                                    <Input
                                        aria-label="Client email"
                                        type="email"
                                        placeholder="client@example.com"
                                        value={data.client_email}
                                        onChange={(e) =>
                                            setData(
                                                'client_email',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Client phone"
                                    error={errors.client_phone}
                                >
                                    <Input
                                        aria-label="Client phone"
                                        placeholder="555-0142"
                                        value={data.client_phone}
                                        onChange={(e) =>
                                            setData(
                                                'client_phone',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label>Site details (optional)</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Site address"
                                    error={errors.site_address}
                                >
                                    <Input
                                        aria-label="Site address"
                                        placeholder="12 Harborview Lane"
                                        value={data.site_address}
                                        onChange={(e) =>
                                            setData(
                                                'site_address',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Site area"
                                    error={errors.site_area}
                                >
                                    <div className="relative">
                                        <Input
                                            aria-label="Site area"
                                            type="number"
                                            min="0"
                                            step="any"
                                            placeholder="3,200"
                                            className="pr-14"
                                            value={data.site_area}
                                            onChange={(e) =>
                                                setData(
                                                    'site_area',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                                            sq ft
                                        </span>
                                    </div>
                                </Field>
                            </div>
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
