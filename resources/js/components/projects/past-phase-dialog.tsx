import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { show } from '@/routes/projects/phases';
import { statusLabel } from '@/components/projects/phase-timeline';
import type { PhaseActivitySummary, ProjectPhaseStatus } from '@/types';

type PastPhaseData = {
    phase: { id: number; name: string; status: ProjectPhaseStatus };
    activities: PhaseActivitySummary[];
};

/**
 * A read-only view of a phase's conversation - for reviewing a phase that
 * isn't the project's current one anymore, opened from an Activity
 * Timeline entry. No composer, no advance/approve actions.
 */
export function PastPhaseDialog({
    projectId,
    phaseId,
    onOpenChange,
}: {
    projectId: number;
    phaseId: number | null;
    onOpenChange: (open: boolean) => void;
}) {
    const [data, setData] = useState<PastPhaseData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (phaseId === null) {
            setData(null);
            return;
        }

        setLoading(true);

        void fetch(show([projectId, phaseId]).url, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((response) => response.json())
            .then((json: PastPhaseData) => setData(json))
            .finally(() => setLoading(false));
    }, [projectId, phaseId]);

    return (
        <Dialog
            open={phaseId !== null}
            onOpenChange={(open) => !open && onOpenChange(false)}
        >
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogTitle>{data?.phase.name ?? 'Phase'}</DialogTitle>
                {data && (
                    <p className="text-muted-foreground -mt-2 text-xs">
                        {statusLabel(data.phase.status)}
                    </p>
                )}

                {loading && (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                )}

                {!loading && data && data.activities.length === 0 && (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        No activity in this phase.
                    </p>
                )}

                {!loading && data && data.activities.length > 0 && (
                    <ul className="space-y-3">
                        {data.activities.map((activity) => (
                            <li key={activity.id} className="text-sm">
                                <p>
                                    <span className="font-medium">
                                        {activity.author.name}
                                    </span>{' '}
                                    {activity.body ? (
                                        <span className="text-muted-foreground">
                                            {activity.body}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground italic">
                                            {activity.type.replace('_', ' ')}
                                        </span>
                                    )}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {new Date(
                                        activity.created_at,
                                    ).toLocaleString()}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </DialogContent>
        </Dialog>
    );
}
