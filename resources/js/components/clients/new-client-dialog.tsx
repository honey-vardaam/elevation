import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { Field } from '@/components/field';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { store } from '@/routes/clients';

export function NewClientDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>New Client</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>New client</DialogTitle>

                <Form
                    {...store.form()}
                    onSuccess={() => setOpen(false)}
                    resetOnSuccess
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    htmlFor="new-client-name"
                                    label="Name"
                                    required
                                    error={errors.name}
                                >
                                    <Input
                                        id="new-client-name"
                                        name="name"
                                        placeholder="Jane Cooper"
                                        autoFocus
                                        required
                                    />
                                </Field>
                                <Field
                                    htmlFor="new-client-company"
                                    label="Company"
                                    error={errors.company}
                                >
                                    <Input
                                        id="new-client-company"
                                        name="company"
                                        placeholder="Acme Inc."
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    htmlFor="new-client-email"
                                    label="Email"
                                    error={errors.email}
                                >
                                    <Input
                                        id="new-client-email"
                                        name="email"
                                        type="email"
                                        placeholder="jane@example.com"
                                    />
                                </Field>
                                <Field
                                    htmlFor="new-client-phone"
                                    label="Phone"
                                    error={errors.phone}
                                >
                                    <Input
                                        id="new-client-phone"
                                        name="phone"
                                        placeholder="555-0142"
                                    />
                                </Field>
                            </div>
                            <Field
                                htmlFor="new-client-address"
                                label="Address"
                                error={errors.address}
                            >
                                <Input
                                    id="new-client-address"
                                    name="address"
                                    placeholder="123 Main St, Springfield"
                                />
                            </Field>
                            <Field
                                htmlFor="new-client-notes"
                                label="Notes"
                                error={errors.notes}
                            >
                                <Textarea
                                    id="new-client-notes"
                                    name="notes"
                                    rows={3}
                                    placeholder="Anything worth remembering about this client…"
                                />
                            </Field>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Add client
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
