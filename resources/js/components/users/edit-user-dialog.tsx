import { Form } from '@inertiajs/react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
                            <div className="grid gap-2">
                                <Label htmlFor="edit-user-name">Name</Label>
                                <Input
                                    id="edit-user-name"
                                    name="name"
                                    defaultValue={user.name}
                                    autoFocus
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-user-email">Email</Label>
                                <Input
                                    id="edit-user-email"
                                    name="email"
                                    type="email"
                                    defaultValue={user.email}
                                    required
                                />
                                <InputError message={errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-user-role">Role</Label>
                                <UserRoleSelect
                                    name="role"
                                    defaultValue={user.role}
                                />
                                <InputError message={errors.role} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-user-password">
                                    New password (leave blank to keep
                                    current)
                                </Label>
                                <PasswordInput
                                    id="edit-user-password"
                                    name="password"
                                />
                                <InputError message={errors.password} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-user-password-confirmation">
                                    Confirm new password
                                </Label>
                                <PasswordInput
                                    id="edit-user-password-confirmation"
                                    name="password_confirmation"
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
