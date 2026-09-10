import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { MemberRoleSelect } from '@/components/projects/member-role-select';
import type { AssignableUser, ProjectRole } from '@/types';

export type MemberSelection = {
    user_id: number;
    role: Exclude<ProjectRole, 'owner'>;
};

export function MemberPicker({
    users,
    value,
    onChange,
}: {
    users: AssignableUser[];
    value: MemberSelection[];
    onChange: (value: MemberSelection[]) => void;
}) {
    function toggle(userId: number, checked: boolean) {
        if (checked) {
            onChange([...value, { user_id: userId, role: 'viewer' }]);
        } else {
            onChange(value.filter((member) => member.user_id !== userId));
        }
    }

    function setRole(userId: number, role: MemberSelection['role']) {
        onChange(
            value.map((member) =>
                member.user_id === userId ? { ...member, role } : member,
            ),
        );
    }

    if (users.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No other users exist yet.
            </p>
        );
    }

    return (
        <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border p-3">
            {users.map((user) => {
                const selected = value.find(
                    (member) => member.user_id === user.id,
                );

                return (
                    <div key={user.id} className="flex items-center gap-3">
                        <Checkbox
                            checked={selected !== undefined}
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
                            <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                        <MemberRoleSelect
                            value={selected?.role}
                            onValueChange={(role) =>
                                setRole(
                                    user.id,
                                    role as MemberSelection['role'],
                                )
                            }
                            disabled={selected === undefined}
                        />
                    </div>
                );
            })}
        </div>
    );
}
