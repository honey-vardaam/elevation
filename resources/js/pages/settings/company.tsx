import { Form, Head } from '@inertiajs/react';
import { type ChangeEvent, useState } from 'react';
import { Building2 } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { edit, update } from '@/routes/company';
import type { CompanyProfile } from '@/types';

export default function CompanySettings({
    company,
}: {
    company: CompanyProfile;
}) {
    const [logoPreview, setLogoPreview] = useState<string | null>(
        company.logo_url,
    );

    function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        if (!file) {
            setLogoPreview(company.logo_url);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }

    return (
        <>
            <Head title="Company" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Company profile"
                    description="Shown at the end of every published portfolio."
                />

                <Form
                    {...update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="flex items-center gap-4">
                                <Avatar className="size-16 rounded-lg">
                                    {logoPreview && (
                                        <AvatarImage
                                            src={logoPreview}
                                            className="object-contain"
                                        />
                                    )}
                                    <AvatarFallback className="rounded-lg">
                                        <Building2 className="text-muted-foreground size-6" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid gap-2">
                                    <Label htmlFor="logo">Logo</Label>
                                    <Input
                                        id="logo"
                                        name="logo"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                    />
                                    <InputError message={errors.logo} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Company name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={company.name ?? ''}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    defaultValue={company.address ?? ''}
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        defaultValue={company.phone ?? ''}
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        defaultValue={company.email ?? ''}
                                    />
                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    name="website"
                                    placeholder="https://example.com"
                                    defaultValue={company.website ?? ''}
                                />
                                <InputError message={errors.website} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="about">About</Label>
                                <Textarea
                                    id="about"
                                    name="about"
                                    rows={4}
                                    defaultValue={company.about ?? ''}
                                />
                                <InputError message={errors.about} />
                            </div>

                            <Button type="submit" disabled={processing}>
                                {processing && <Spinner />}
                                Save
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

CompanySettings.layout = {
    breadcrumbs: [{ title: 'Company', href: edit() }],
};
