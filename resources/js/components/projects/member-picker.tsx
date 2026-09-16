import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MemberRoleSelect } from '@/components/projects/member-role-select';
import type { AssignableUser, ProjectRole, TeamSummary } from '@/types';

export type MemberSelection = {
    user_id: number;
    role: Exclude<ProjectRole, 'owner'>;
};

export function MemberPicker({
    users,
    teams = [],
    value,
    onChange,
}: {
    users: AssignableUser[];
    teams?: TeamSummary[];
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

    function isTeamSelected(team: TeamSummary): boolean {
        const selectedIds = new Set(value.map((member) => member.user_id));
        return (
            team.members.length > 0 &&
            team.members.every((member) => selectedIds.has(member.id))
        );
    }

    function toggleTeam(team: TeamSummary) {
        const teamMemberIds = new Set(team.members.map((member) => member.id));

        if (isTeamSelected(team)) {
            onChange(
                value.filter((member) => !teamMemberIds.has(member.user_id)),
            );
            return;
        }

        const selectedIds = new Set(value.map((member) => member.user_id));
        const additions = team.members
            .filter((member) => !selectedIds.has(member.id))
            .map((member) => ({
                user_id: member.id,
                role: 'viewer' as const,
            }));

        onChange([...value, ...additions]);
    }

    if (users.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">
                No other users exist yet.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {teams.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs">Team:</span>
                    {teams.map((team) => {
                        const selected = isTeamSelected(team);

                        return (
                            <button
                                key={team.id}
                                type="button"
                                onClick={() => toggleTeam(team)}
                            >
                                <Badge
                                    variant={selected ? 'default' : 'outline'}
                                    className={
                                        selected
                                            ? 'cursor-pointer'
                                            : 'hover:bg-muted cursor-pointer'
                                    }
                                >
                                    {selected ? '−' : '+'} {team.name}
                                </Badge>
                            </button>
                        );
                    })}
                </div>
            )}
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
                                <p className="text-muted-foreground truncate text-xs">
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
        </div>
    );
}
