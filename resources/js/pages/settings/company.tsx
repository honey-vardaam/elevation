import { Form, Head } from '@inertiajs/react';
import { type ChangeEvent, useState } from 'react';
import { Building2 } from 'lucide-react';
import Heading from '@/components/heading';
import { Field } from '@/components/field';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
                <Heading variant="small" title="Company profile" />

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
                                <Field
                                    htmlFor="logo"
                                    label="Logo"
                                    error={errors.logo}
                                >
                                    <Input
                                        id="logo"
                                        name="logo"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                    />
                                </Field>
                            </div>

                            <Field
                                htmlFor="name"
                                label="Company name"
                                error={errors.name}
                            >
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Your company name"
                                    defaultValue={company.name ?? ''}
                                />
                            </Field>

                            <Field
                                htmlFor="address"
                                label="Address"
                                error={errors.address}
                            >
                                <Input
                                    id="address"
                                    name="address"
                                    placeholder="123 Main St, Springfield"
                                    defaultValue={company.address ?? ''}
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    htmlFor="phone"
                                    label="Phone"
                                    error={errors.phone}
                                >
                                    <Input
                                        id="phone"
                                        name="phone"
                                        placeholder="555-0142"
                                        defaultValue={company.phone ?? ''}
                                    />
                                </Field>
                                <Field
                                    htmlFor="email"
                                    label="Email"
                                    error={errors.email}
                                >
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="hello@example.com"
                                        defaultValue={company.email ?? ''}
                                    />
                                </Field>
                            </div>

                            <Field
                                htmlFor="website"
                                label="Website"
                                error={errors.website}
                            >
                                <Input
                                    id="website"
                                    name="website"
                                    placeholder="https://example.com"
                                    defaultValue={company.website ?? ''}
                                />
                            </Field>

                            <Field
                                htmlFor="about"
                                label="About"
                                error={errors.about}
                            >
                                <Textarea
                                    id="about"
                                    name="about"
                                    rows={4}
                                    placeholder="A short description of your company…"
                                    defaultValue={company.about ?? ''}
                                />
                            </Field>

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
