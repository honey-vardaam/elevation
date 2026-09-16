import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Heading from '@/components/heading';
import { TeamList } from '@/components/settings/team-list';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/teams';
import type { AssignableUser, TeamSummary } from '@/types';

export default function Teams({
    teams,
    assignableUsers,
}: {
    teams: TeamSummary[];
    assignableUsers: AssignableUser[];
}) {
    const [addingTeam, setAddingTeam] = useState(false);

    return (
        <>
            <Head title="Teams" />

            <h1 className="sr-only">Teams</h1>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <Heading
                        variant="small"
                        title="Teams"
                        description="Group existing staff into teams (e.g. Structural Team) so they can be added to projects together."
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAddingTeam(true)}
                    >
                        <Plus className="size-4" />
                        Add team
                    </Button>
                </div>

                <TeamList
                    teams={teams}
                    assignableUsers={assignableUsers}
                    addOpen={addingTeam}
                    onAddOpenChange={setAddingTeam}
                />
            </div>
        </>
    );
}

Teams.layout = {
    breadcrumbs: [{ title: 'Teams', href: index() }],
};
