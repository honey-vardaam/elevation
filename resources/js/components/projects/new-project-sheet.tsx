import { useForm } from '@inertiajs/react';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import InputError from '@/components/input-error';
import {
    MemberPicker,
    type MemberSelection,
} from '@/components/projects/member-picker';
import { ProjectStatusSelect } from '@/components/projects/project-status-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { store } from '@/routes/projects';
import type { AssignableUser, ProjectStatus } from '@/types';

type FormData = {
    name: string;
    description: string;
    banner: File | null;
    status: ProjectStatus;
    client_name: string;
    client_email: string;
    client_phone: string;
    site_address: string;
    site_area: string;
    start_date: string;
    end_date: string;
    use_default_folders: boolean;
    members: MemberSelection[];
};

const initialData: FormData = {
    name: '',
    description: '',
    banner: null,
    status: 'ongoing',
    client_name: '',
    client_email: '',
    client_phone: '',
    site_address: '',
    site_area: '',
    start_date: '',
    end_date: '',
    use_default_folders: true,
    members: [],
};

export function NewProjectSheet({
    assignableUsers,
}: {
    assignableUsers: AssignableUser[];
}) {
    const [open, setOpen] = useState(false);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const { data, setData, post, processing, errors, reset } =
        useForm<FormData>(initialData);

    function handleBannerChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setData('banner', file);

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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>New Project</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>New project</SheetTitle>
                    <SheetDescription>
                        Set up a new project, including who can access it.
                    </SheetDescription>
                </SheetHeader>

                <form
                    id="new-project-form"
                    onSubmit={handleSubmit}
                    className="flex-1 space-y-4 overflow-y-auto px-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="banner">Banner (optional)</Label>
                        {bannerPreview && (
                            <img
                                src={bannerPreview}
                                alt=""
                                className="h-32 w-full rounded-lg object-cover"
                            />
                        )}
                        <Input
                            id="banner"
                            type="file"
                            accept="image/*"
                            onChange={handleBannerChange}
                        />
                        <InputError message={errors.banner} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoFocus
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            rows={3}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <ProjectStatusSelect
                            value={data.status}
                            onValueChange={(status) =>
                                setData('status', status)
                            }
                        />
                        <InputError message={errors.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start_date">Start date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) =>
                                    setData('start_date', e.target.value)
                                }
                            />
                            <InputError message={errors.start_date} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end_date">End date</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(e) =>
                                    setData('end_date', e.target.value)
                                }
                            />
                            <InputError message={errors.end_date} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Client details (optional)</Label>
                        <Input
                            aria-label="Client name"
                            placeholder="Client name"
                            value={data.client_name}
                            onChange={(e) =>
                                setData('client_name', e.target.value)
                            }
                        />
                        <InputError message={errors.client_name} />
                        <Input
                            aria-label="Client email"
                            type="email"
                            placeholder="Client email"
                            value={data.client_email}
                            onChange={(e) =>
                                setData('client_email', e.target.value)
                            }
                        />
                        <InputError message={errors.client_email} />
                        <Input
                            aria-label="Client phone"
                            placeholder="Client phone"
                            value={data.client_phone}
                            onChange={(e) =>
                                setData('client_phone', e.target.value)
                            }
                        />
                        <InputError message={errors.client_phone} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Site details (optional)</Label>
                        <Input
                            aria-label="Site address"
                            placeholder="Site address"
                            value={data.site_address}
                            onChange={(e) =>
                                setData('site_address', e.target.value)
                            }
                        />
                        <InputError message={errors.site_address} />
                        <Input
                            aria-label="Site area"
                            placeholder="Site area (e.g. 5,000 sq ft)"
                            value={data.site_area}
                            onChange={(e) =>
                                setData('site_area', e.target.value)
                            }
                        />
                        <InputError message={errors.site_area} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Give access to</Label>
                        <MemberPicker
                            users={assignableUsers}
                            value={data.members}
                            onChange={(members) =>
                                setData('members', members)
                            }
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="use_default_folders"
                            checked={data.use_default_folders}
                            onCheckedChange={(checked) =>
                                setData(
                                    'use_default_folders',
                                    checked === true,
                                )
                            }
                        />
                        <Label htmlFor="use_default_folders">
                            Use default folder structure
                        </Label>
                    </div>
                </form>

                <SheetFooter className="flex-row justify-end gap-2">
                    <SheetClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </SheetClose>
                    <Button
                        type="submit"
                        form="new-project-form"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Create project
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
