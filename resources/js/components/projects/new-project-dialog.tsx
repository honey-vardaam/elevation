import { useForm } from '@inertiajs/react';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import InputError from '@/components/input-error';
import { Field } from '@/components/field';
import { BannerAdjuster } from '@/components/projects/banner-adjuster';
import { LocationPicker } from '@/components/projects/location-picker';
import {
    MemberPicker,
    type MemberSelection,
} from '@/components/projects/member-picker';
import { ProjectStatusSelect } from '@/components/projects/project-status-select';
import { ProjectTypeSelect } from '@/components/projects/project-type-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { store } from '@/routes/projects';
import type {
    AssignableUser,
    PhaseFlowTemplateSummary,
    ProjectStatus,
    ProjectType,
    TeamSummary,
} from '@/types';

type FormData = {
    name: string;
    description: string;
    banner: File | null;
    banner_focal_x: number;
    banner_focal_y: number;
    banner_zoom: number;
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
    use_default_folders: boolean;
    phase_flow_template_id: number | null;
    members: MemberSelection[];
};

const initialData: FormData = {
    name: '',
    description: '',
    banner: null,
    banner_focal_x: 50,
    banner_focal_y: 50,
    banner_zoom: 1,
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
    use_default_folders: true,
    phase_flow_template_id: null,
    members: [],
};

export function NewProjectDialog({
    assignableUsers,
    teams,
    phaseFlowTemplates,
}: {
    assignableUsers: AssignableUser[];
    teams: TeamSummary[];
    phaseFlowTemplates: PhaseFlowTemplateSummary[];
}) {
    const [open, setOpen] = useState(false);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const { data, setData, post, processing, errors, reset, transform } =
        useForm<FormData>(initialData);

    // Inertia flattens `members.*.user_id`/`members.*.role` errors as
    // dot-notation keys - the picker has no per-row error UI, so surface
    // the first one as a single message under it instead of dropping it.
    const memberError = Object.entries(errors).find(([key]) =>
        key.startsWith('members'),
    )?.[1];

    function handleBannerChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setData((prev) => ({
            ...prev,
            banner: file,
            banner_focal_x: 50,
            banner_focal_y: 50,
            banner_zoom: 1,
        }));

        if (!file) {
            setBannerPreview(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setBannerPreview(reader.result as string);
        reader.readAsDataURL(file);
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        transform((formData) => ({
            ...formData,
            type: formData.type === 'none' ? '' : formData.type,
        }));

        post(store().url, {
            forceFormData: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                setBannerPreview(null);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>New Project</Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[85vh] w-full flex-col sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>New project</DialogTitle>
                    <DialogDescription>
                        Set up a new project, including who can access it.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="new-project-form"
                    onSubmit={handleSubmit}
                    className="flex-1 space-y-4 overflow-y-auto pr-1"
                >
                    <Field
                        htmlFor="banner"
                        label="Banner (optional)"
                        error={errors.banner}
                    >
                        {bannerPreview && (
                            <BannerAdjuster
                                imageUrl={bannerPreview}
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
                        <Input
                            id="banner"
                            type="file"
                            accept="image/*"
                            onChange={handleBannerChange}
                        />
                    </Field>

                    <Field
                        htmlFor="name"
                        label="Name"
                        required
                        error={errors.name}
                    >
                        <Input
                            id="name"
                            placeholder="Harborview Residence"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoFocus
                        />
                    </Field>

                    <Field
                        htmlFor="description"
                        label="Description"
                        error={errors.description}
                    >
                        <Textarea
                            id="description"
                            rows={3}
                            placeholder="A short summary of the project…"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field
                            htmlFor="status"
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
                            htmlFor="type"
                            label="Type (optional)"
                            error={errors.type}
                        >
                            <ProjectTypeSelect
                                value={data.type}
                                onValueChange={(type) => setData('type', type)}
                                className="w-full"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field
                            htmlFor="start_date"
                            label="Start date"
                            error={errors.start_date}
                        >
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) =>
                                    setData('start_date', e.target.value)
                                }
                            />
                        </Field>
                        <Field
                            htmlFor="end_date"
                            label="End date"
                            error={errors.end_date}
                        >
                            <Input
                                id="end_date"
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
                        <Field label="Client name" error={errors.client_name}>
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
                                        setData('client_email', e.target.value)
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
                                        setData('client_phone', e.target.value)
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
                                        setData('site_address', e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Site area" error={errors.site_area}>
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
                                            setData('site_area', e.target.value)
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

                    <div className="grid gap-2">
                        <Label>Give access to</Label>
                        <MemberPicker
                            users={assignableUsers}
                            teams={teams}
                            value={data.members}
                            onChange={(members) => setData('members', members)}
                        />
                        <InputError message={memberError} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="use_default_folders"
                            checked={data.use_default_folders}
                            onCheckedChange={(checked) =>
                                setData('use_default_folders', checked === true)
                            }
                        />
                        <Label htmlFor="use_default_folders">
                            Use default folder structure
                        </Label>
                    </div>

                    {phaseFlowTemplates.length > 0 && (
                        <Field
                            htmlFor="phase_flow_template_id"
                            label="Phase pipeline"
                        >
                            <Select
                                value={
                                    data.phase_flow_template_id === null
                                        ? 'none'
                                        : String(data.phase_flow_template_id)
                                }
                                onValueChange={(value) =>
                                    setData(
                                        'phase_flow_template_id',
                                        value === 'none' ? null : Number(value),
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="phase_flow_template_id"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        No pipeline
                                    </SelectItem>
                                    {phaseFlowTemplates.map((flow) => (
                                        <SelectItem
                                            key={flow.id}
                                            value={String(flow.id)}
                                        >
                                            {flow.name} ({flow.steps_count}{' '}
                                            phases)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    )}
                </form>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="new-project-form"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Create project
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
