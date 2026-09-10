import { Form } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { UserRoleSelect } from '@/components/users/user-role-select';
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
import { store } from '@/routes/users';

export function NewUserDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>New User</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>New user</DialogTitle>

                <Form
                    {...store.form()}
                    onSuccess={() => setOpen(false)}
                    resetOnSuccess
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="new-user-name">Name</Label>
                                <Input
                                    id="new-user-name"
                                    name="name"
                                    autoFocus
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-user-email">Email</Label>
                                <Input
                                    id="new-user-email"
                                    name="email"
                                    type="email"
                                    required
                                />
                                <InputError message={errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-user-role">Role</Label>
                                <UserRoleSelect
                                    name="role"
                                    defaultValue="staff"
                                />
                                <InputError message={errors.role} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-user-password">
                                    Password
                                </Label>
                                <PasswordInput
                                    id="new-user-password"
                                    name="password"
                                    required
                                />
                                <InputError message={errors.password} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-user-password-confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="new-user-password-confirmation"
                                    name="password_confirmation"
                                    required
                                />
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create user
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
