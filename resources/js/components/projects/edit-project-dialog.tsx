import { useForm } from '@inertiajs/react';
import { type FormEvent, useEffect } from 'react';
import InputError from '@/components/input-error';
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
import type { ProjectSummary, ProjectType } from '@/types';

type FormData = {
    name: string;
    description: string;
    type: ProjectType | 'none';
    site_area: string;
    latitude: number | null;
    longitude: number | null;
};

function formDataFrom(project: ProjectSummary): FormData {
    return {
        name: project.name,
        description: project.description ?? '',
        type: project.type ?? 'none',
        site_area: project.site_area === null ? '' : String(project.site_area),
        latitude: project.latitude,
        longitude: project.longitude,
    };
}

export function EditProjectDialog({
    project,
    onOpenChange,
}: {
    project: ProjectSummary | null;
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
              },
    );

    useEffect(() => {
        if (project) {
            clearErrors();
            setData(formDataFrom(project));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.id]);

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
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog
            open={project !== null}
            onOpenChange={(open) => !open && onOpenChange(false)}
        >
            <DialogContent>
                <DialogTitle>Edit project</DialogTitle>
                {project && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-project-name">Name</Label>
                            <Input
                                id="edit-project-name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                autoFocus
                                required
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-project-description">
                                Description
                            </Label>
                            <Input
                                id="edit-project-description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                            <InputError message={errors.description} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-project-type">
                                    Type
                                </Label>
                                <ProjectTypeSelect
                                    value={data.type}
                                    onValueChange={(type) =>
                                        setData('type', type)
                                    }
                                />
                                <InputError message={errors.type} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-project-site-area">
                                    Site area (sq ft)
                                </Label>
                                <Input
                                    id="edit-project-site-area"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={data.site_area}
                                    onChange={(e) =>
                                        setData('site_area', e.target.value)
                                    }
                                />
                                <InputError message={errors.site_area} />
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
