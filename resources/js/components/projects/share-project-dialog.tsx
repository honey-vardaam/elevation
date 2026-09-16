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
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
    destroy as destroyMember,
    store as storeMember,
    update as updateMember,
} from '@/routes/projects/members';
import type { ProjectMemberSummary } from '@/types';

export function ShareProjectDialog({
    projectId,
    members,
    canManage,
}: {
    projectId: number;
    members: ProjectMemberSummary[];
    canManage: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <Field
                                        htmlFor="member-email"
                                        label="Add member by email"
                                        required
                                        error={errors.email}
                                    >
                                        <Input
                                            id="member-email"
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            required
                                        />
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

                                    <Button type="submit" disabled={processing}>
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
