export type PhaseActivityType =
    | 'comment'
    | 'change_request'
    | 'status_changed'
    | 'approved'
    | 'project_completed';

export type ActivityStatus = 'open' | 'changes_requested' | 'resolved';

export type PhaseActivitySummary = {
    id: number;
    type: PhaseActivityType;
    body: string | null;
    meta: { from?: string; to?: string } | null;
    resolved_at: string | null;
    resolved_by: { id: number; name: string } | null;
    reviewer: { id: number; name: string } | null;
    activity_status: ActivityStatus | null;
    author: { id: number; name: string };
    attachment: {
        id: number;
        name: string;
        size: number;
        mime_type: string | null;
        download_url: string;
    } | null;
    created_at: string;
    replies: PhaseActivitySummary[];
};

export type TaggableMember = {
    id: number;
    name: string;
};
