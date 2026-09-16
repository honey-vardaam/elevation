import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { Field } from '@/components/field';
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
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    htmlFor="new-user-name"
                                    label="Name"
                                    required
                                    error={errors.name}
                                >
                                    <Input
                                        id="new-user-name"
                                        name="name"
                                        placeholder="Jane Cooper"
                                        autoFocus
                                        required
                                    />
                                </Field>
                                <Field
                                    htmlFor="new-user-email"
                                    label="Email"
                                    required
                                    error={errors.email}
                                >
                                    <Input
                                        id="new-user-email"
                                        name="email"
                                        type="email"
                                        placeholder="jane@example.com"
                                        required
                                    />
                                </Field>
                            </div>
                            <Field
                                htmlFor="new-user-role"
                                label="Role"
                                required
                                error={errors.role}
                            >
                                <UserRoleSelect
                                    name="role"
                                    defaultValue="staff"
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    htmlFor="new-user-password"
                                    label="Password"
                                    required
                                    error={errors.password}
                                >
                                    <PasswordInput
                                        id="new-user-password"
                                        name="password"
                                        placeholder="At least 8 characters"
                                        required
                                    />
                                </Field>
                                <Field
                                    htmlFor="new-user-password-confirmation"
                                    label="Confirm password"
                                >
                                    <PasswordInput
                                        id="new-user-password-confirmation"
                                        name="password_confirmation"
                                        placeholder="Re-enter password"
                                        required
                                    />
                                </Field>
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
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
