import type { ProjectPhaseStatus } from './projects';

export type ConversationSummary = {
    phase_id: number;
    phase_name: string;
    phase_status: ProjectPhaseStatus;
    project: { id: number; name: string };
    open_change_requests_count: number;
    last_activity: {
        author_name: string;
        preview: string;
        created_at: string;
    } | null;
};

export type ActivePhase = {
    id: number;
    name: string;
    status: ProjectPhaseStatus;
    project: { id: number; name: string };
    open_change_requests_count: number;
};
