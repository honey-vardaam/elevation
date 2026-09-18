import { Form, router } from '@inertiajs/react';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Field } from '@/components/field';
import { MemberRoleSelect } from '@/components/projects/member-role-select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
    destroy as destroyMember,
    store as storeMember,
    update as updateMember,
} from '@/routes/projects/members';
import type { AssignableUser, ProjectMemberSummary } from '@/types';

export function ShareProjectDialog({
    projectId,
    members,
    canManage,
    users = [],
    ownerId,
}: {
    projectId: number;
    members: ProjectMemberSummary[];
    canManage: boolean;
    users?: AssignableUser[];
    ownerId?: number;
}) {
    const [open, setOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState('');

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) {
                    setSelectedEmail('');
                }
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline">Share</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogTitle>Share project</DialogTitle>

                <div className="space-y-3">
                    {members.length === 0 && (
                        <p className="text-muted-foreground text-sm">
                            Only you have access to this project so far.
                        </p>
                    )}

                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-3"
                        >
                            <Avatar className="size-8">
                                <AvatarFallback>
                                    {member.user.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {member.user.name}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">
                                    {member.user.email}
                                </p>
                            </div>
                            {canManage ? (
                                <>
                                    <MemberRoleSelect
                                        value={member.role}
                                        onValueChange={(role) =>
                                            router.patch(
                                                updateMember([
                                                    projectId,
                                                    member.id,
                                                ]).url,
                                                { role },
                                                { preserveScroll: true },
                                            )
                                        }
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() =>
                                            router.delete(
                                                destroyMember([
                                                    projectId,
                                                    member.id,
                                                ]).url,
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Trash2 className="size-4" />
                                        <span className="sr-only">Remove</span>
                                    </Button>
                                </>
                            ) : (
                                <span className="text-muted-foreground text-sm capitalize">
                                    {member.role}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {canManage && (
                    <>
                        <Separator />

                        <Form
                            {...storeMember.form(projectId)}
                            resetOnSuccess
                            onSuccess={() => setSelectedEmail('')}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <Field
                                        htmlFor="member-user"
                                        label="Select user"
                                        required
                                        error={errors.email}
                                    >
                                        <select
                                            id="member-user"
                                            name="email"
                                            value={selectedEmail}
                                            onChange={(e) =>
                                                setSelectedEmail(e.target.value)
                                            }
                                            required
                                            className="bg-input/50 focus-visible:border-ring focus-visible:ring-ring/30 text-foreground flex h-8 w-full rounded-2xl border border-transparent px-2.5 py-1 text-sm transition-[color,box-shadow] duration-200 outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-popover [&>option]:text-popover-foreground"
                                        >
                                            <option value="" disabled>
                                                Select a user to add...
                                            </option>
                                            {users.length === 0 ? (
                                                <option value="" disabled>
                                                    No users found
                                                </option>
                                            ) : (
                                                users.map((user) => {
                                                    const isOwner =
                                                        user.id === ownerId;
                                                    const isMember =
                                                        members.some(
                                                            (m) =>
                                                                m.user.id ===
                                                                user.id,
                                                        );
                                                    const isAssigned =
                                                        isOwner || isMember;

                                                    return (
                                                        <option
                                                            key={user.id}
                                                            value={user.email}
                                                            disabled={
                                                                isAssigned
                                                            }
                                                        >
                                                            {user.name} ({user.email})
                                                            {isOwner
                                                                ? ' — Owner'
                                                                : isMember
                                                                  ? ' — Already added'
                                                                  : ''}
                                                        </option>
                                                    );
                                                })
                                            )}
                                        </select>
                                    </Field>

                                    <Field
                                        htmlFor="member-role"
                                        label="Role"
                                        required
                                        error={errors.role}
                                    >
                                        <MemberRoleSelect
                                            name="role"
                                            defaultValue="viewer"
                                        />
                                    </Field>

                                    <Button
                                        type="submit"
                                        disabled={
                                            processing || !selectedEmail
                                        }
                                    >
                                        {processing && <Spinner />}
                                        Add member
                                    </Button>
                                </>
                            )}
                        </Form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
