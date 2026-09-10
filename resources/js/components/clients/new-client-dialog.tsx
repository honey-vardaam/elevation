import { Form } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
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
import { Label } from '@/components/ui/label';
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
                            <div className="grid gap-2">
                                <Label htmlFor="new-client-name">Name</Label>
                                <Input
                                    id="new-client-name"
                                    name="name"
                                    autoFocus
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-client-company">
                                    Company
                                </Label>
                                <Input
                                    id="new-client-company"
                                    name="company"
                                />
                                <InputError message={errors.company} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="new-client-email">
                                        Email
                                    </Label>
                                    <Input
                                        id="new-client-email"
                                        name="email"
                                        type="email"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new-client-phone">
                                        Phone
                                    </Label>
                                    <Input
                                        id="new-client-phone"
                                        name="phone"
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-client-address">
                                    Address
                                </Label>
                                <Input
                                    id="new-client-address"
                                    name="address"
                                />
                                <InputError message={errors.address} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-client-notes">
                                    Notes
                                </Label>
                                <Textarea
                                    id="new-client-notes"
                                    name="notes"
                                    rows={3}
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
