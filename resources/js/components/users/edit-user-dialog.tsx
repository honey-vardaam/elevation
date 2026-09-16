import { Form } from '@inertiajs/react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/users';
import type { UserSummary } from '@/types';

export function EditUserDialog({
    user,
    open,
    onOpenChange,
}: {
    user: UserSummary;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Edit user</DialogTitle>

                <Form
                    {...update.form(user.id)}
                    method="patch"
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    htmlFor="edit-user-name"
                                    label="Name"
                                    required
                                    error={errors.name}
                                >
                                    <Input
                                        id="edit-user-name"
                                        name="name"
                                        placeholder="Jane Cooper"
                                        defaultValue={user.name}
                                        autoFocus
                                        required
                                    />
                                </Field>
                                <Field
                                    htmlFor="edit-user-email"
                                    label="Email"
                                    required
                                    error={errors.email}
                                >
                                    <Input
                                        id="edit-user-email"
                                        name="email"
                                        type="email"
                                        placeholder="jane@example.com"
                                        defaultValue={user.email}
                                        required
                                    />
                                </Field>
                            </div>
                            <Field
                                htmlFor="edit-user-role"
                                label="Role"
                                required
                                error={errors.role}
                            >
                                <UserRoleSelect
                                    name="role"
                                    defaultValue={user.role}
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    htmlFor="edit-user-password"
                                    label="New password"
                                    error={errors.password}
                                >
                                    <PasswordInput
                                        id="edit-user-password"
                                        name="password"
                                        placeholder="Leave blank to keep current"
                                    />
                                </Field>
                                <Field
                                    htmlFor="edit-user-password-confirmation"
                                    label="Confirm new password"
                                >
                                    <PasswordInput
                                        id="edit-user-password-confirmation"
                                        name="password_confirmation"
                                        placeholder="Re-enter new password"
                                    />
                                </Field>
                            </div>

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
