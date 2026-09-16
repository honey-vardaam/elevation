import { Form } from '@inertiajs/react';
import { Field } from '@/components/field';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/clients';
import type { ClientSummary } from '@/types';

export function EditClientDialog({
    client,
    open,
    onOpenChange,
}: {
    client: ClientSummary;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Edit client</DialogTitle>

                <Form
                    {...update.form(client.id)}
                    method="patch"
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    htmlFor="edit-client-name"
                                    label="Name"
                                    required
                                    error={errors.name}
                                >
                                    <Input
                                        id="edit-client-name"
                                        name="name"
                                        placeholder="Jane Cooper"
                                        defaultValue={client.name}
                                        autoFocus
                                        required
                                    />
                                </Field>
                                <Field
                                    htmlFor="edit-client-company"
                                    label="Company"
                                    error={errors.company}
                                >
                                    <Input
                                        id="edit-client-company"
                                        name="company"
                                        placeholder="Acme Inc."
                                        defaultValue={client.company ?? ''}
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    htmlFor="edit-client-email"
                                    label="Email"
                                    error={errors.email}
                                >
                                    <Input
                                        id="edit-client-email"
                                        name="email"
                                        type="email"
                                        placeholder="jane@example.com"
                                        defaultValue={client.email ?? ''}
                                    />
                                </Field>
                                <Field
                                    htmlFor="edit-client-phone"
                                    label="Phone"
                                    error={errors.phone}
                                >
                                    <Input
                                        id="edit-client-phone"
                                        name="phone"
                                        placeholder="555-0142"
                                        defaultValue={client.phone ?? ''}
                                    />
                                </Field>
                            </div>
                            <Field
                                htmlFor="edit-client-address"
                                label="Address"
                                error={errors.address}
                            >
                                <Input
                                    id="edit-client-address"
                                    name="address"
                                    placeholder="123 Main St, Springfield"
                                    defaultValue={client.address ?? ''}
                                />
                            </Field>
                            <Field
                                htmlFor="edit-client-notes"
                                label="Notes"
                                error={errors.notes}
                            >
                                <Textarea
                                    id="edit-client-notes"
                                    name="notes"
                                    rows={3}
                                    placeholder="Anything worth remembering about this client…"
                                    defaultValue={client.notes ?? ''}
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
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
