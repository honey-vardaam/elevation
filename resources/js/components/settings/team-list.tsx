import { useForm } from '@inertiajs/react';
import { type FormEvent, useEffect, useState } from 'react';
import { Pencil, Trash2, Users } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { EmptyState } from '@/components/empty-state';
import { Field } from '@/components/field';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { destroy, store, update } from '@/routes/teams';
import type { AssignableUser, TeamSummary } from '@/types';

function TeamMemberPicker({
    users,
    value,
    onChange,
}: {
    users: AssignableUser[];
    value: number[];
    onChange: (value: number[]) => void;
}) {
    function toggle(userId: number, checked: boolean) {
        if (checked) {
            onChange([...value, userId]);
        } else {
            onChange(value.filter((id) => id !== userId));
        }
    }

    if (users.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">
                No other users exist yet.
            </p>
        );
    }

    return (
        <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border p-3">
            {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                    <Checkbox
                        checked={value.includes(user.id)}
                        onCheckedChange={(checked) =>
                            toggle(user.id, checked === true)
                        }
                    />
                    <Avatar className="size-7">
                        <AvatarFallback>
                            {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                            {user.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                            {user.email}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TeamList({
    teams,
    assignableUsers,
    addOpen,
    onAddOpenChange,
}: {
    teams: TeamSummary[];
    assignableUsers: AssignableUser[];
    addOpen: boolean;
    onAddOpenChange: (open: boolean) => void;
}) {
    const [editing, setEditing] = useState<TeamSummary | null>(null);
    const [deleting, setDeleting] = useState<TeamSummary | null>(null);

    return (
        <div className="space-y-2">
            {teams.length === 0 && (
                <EmptyState
                    icon={Users}
                    message="No teams yet. Group your staff into teams (e.g. Structural Team) so they can be added to projects together."
                />
            )}

            <div className="space-y-2">
                {teams.map((team) => (
                    <div
                        key={team.id}
                        className="bg-card flex items-start justify-between gap-3 rounded-lg border p-3"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                                {team.name}
                            </p>
                            {team.description && (
                                <p className="text-muted-foreground truncate text-xs">
                                    {team.description}
                                </p>
                            )}
                            <div className="mt-2 flex -space-x-2">
                                {team.members.slice(0, 6).map((member) => (
                                    <Avatar
                                        key={member.id}
                                        className="border-card size-6 border-2"
                                    >
                                        <AvatarFallback className="text-[10px]">
                                            {member.name
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                {team.members.length === 0 && (
                                    <p className="text-muted-foreground text-xs">
                                        No members yet.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setEditing(team)}
                            >
                                <Pencil className="size-4" />
                                <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleting(team)}
                            >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <TeamEditDialog
                team={editing}
                assignableUsers={assignableUsers}
                onOpenChange={(open) => !open && setEditing(null)}
            />
            <TeamAddDialog
                open={addOpen}
                assignableUsers={assignableUsers}
                onOpenChange={onAddOpenChange}
            />

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete team?"
                description={
                    <>
                        This removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>{' '}
                        as a team. Projects it was already added to keep their
                        existing members.
                    </>
                }
                confirmLabel="Delete team"
                formAction={deleting ? destroy.form(deleting.id) : undefined}
                onSuccess={() => setDeleting(null)}
            />
        </div>
    );
}

function TeamEditDialog({
    team,
    assignableUsers,
    onOpenChange,
}: {
    team: TeamSummary | null;
    assignableUsers: AssignableUser[];
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm({
            name: team?.name ?? '',
            description: team?.description ?? '',
            member_ids: team?.members.map((member) => member.id) ?? [],
        });

    // The dialog stays mounted between edits, so useForm's initial state
    // only reflects whichever team was selected first - resync whenever a
    // different team is opened for editing.
    useEffect(() => {
        if (team) {
            clearErrors();
            setData({
                name: team.name,
                description: team.description ?? '',
                member_ids: team.members.map((member) => member.id),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team]);

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (!team) {
            return;
        }

        patch(update(team.id).url, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog
            open={team !== null}
            onOpenChange={(open) => !open && onOpenChange(false)}
        >
            <DialogContent className="flex max-h-[85vh] flex-col">
                <DialogTitle>Edit team</DialogTitle>
                {team && (
                    <form
                        onSubmit={handleSubmit}
                        className="flex-1 space-y-4 overflow-y-auto pr-1"
                    >
                        <Field
                            htmlFor="team-name"
                            label="Name"
                            error={errors.name}
                        >
                            <Input
                                id="team-name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                autoFocus
                            />
                        </Field>
                        <Field
                            htmlFor="team-description"
                            label="Description"
                            error={errors.description}
                        >
                            <Textarea
                                id="team-description"
                                rows={3}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Members" error={errors.member_ids}>
                            <TeamMemberPicker
                                users={assignableUsers}
                                value={data.member_ids}
                                onChange={(member_ids) =>
                                    setData('member_ids', member_ids)
                                }
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
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

function TeamAddDialog({
    open,
    assignableUsers,
    onOpenChange,
}: {
    open: boolean;
    assignableUsers: AssignableUser[];
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        member_ids: [] as number[],
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        post(store().url, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] flex-col">
                <DialogTitle>Add team</DialogTitle>
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 space-y-4 overflow-y-auto pr-1"
                >
                    <Field
                        htmlFor="new-team-name"
                        label="Name"
                        error={errors.name}
                    >
                        <Input
                            id="new-team-name"
                            placeholder="Structural Team"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoFocus
                            required
                        />
                    </Field>
                    <Field
                        htmlFor="new-team-description"
                        label="Description"
                        error={errors.description}
                    >
                        <Textarea
                            id="new-team-description"
                            rows={3}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                    </Field>
                    <Field label="Members" error={errors.member_ids}>
                        <TeamMemberPicker
                            users={assignableUsers}
                            value={data.member_ids}
                            onChange={(member_ids) =>
                                setData('member_ids', member_ids)
                            }
                        />
                    </Field>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            Add team
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
