import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
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
                            <div className="grid gap-2">
                                <Label htmlFor="edit-client-name">Name</Label>
                                <Input
                                    id="edit-client-name"
                                    name="name"
                                    defaultValue={client.name}
                                    autoFocus
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-client-company">
                                    Company
                                </Label>
                                <Input
                                    id="edit-client-company"
                                    name="company"
                                    defaultValue={client.company ?? ''}
                                />
                                <InputError message={errors.company} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-client-email">
                                        Email
                                    </Label>
                                    <Input
                                        id="edit-client-email"
                                        name="email"
                                        type="email"
                                        defaultValue={client.email ?? ''}
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-client-phone">
                                        Phone
                                    </Label>
                                    <Input
                                        id="edit-client-phone"
                                        name="phone"
                                        defaultValue={client.phone ?? ''}
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-client-address">
                                    Address
                                </Label>
                                <Input
                                    id="edit-client-address"
                                    name="address"
                                    defaultValue={client.address ?? ''}
                                />
                                <InputError message={errors.address} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-client-notes">
                                    Notes
                                </Label>
                                <Textarea
                                    id="edit-client-notes"
                                    name="notes"
                                    rows={3}
                                    defaultValue={client.notes ?? ''}
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">
                                        Cancel
                                    </Button>
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
