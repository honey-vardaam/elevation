export type PhaseActivityType =
    | 'comment'
    | 'change_request'
    | 'review'
    | 'status_changed'
    | 'approved'
    | 'project_completed';

export type ReviewStatus = 'pending' | 'changes_requested' | 'approved';

export type PhaseActivitySummary = {
    id: number;
    type: PhaseActivityType;
    body: string | null;
    meta: { from?: string; to?: string } | null;
    resolved_at: string | null;
    resolved_by: { id: number; name: string } | null;
    reviewer: { id: number; name: string } | null;
    review_status: ReviewStatus | null;
    author: { id: number; name: string };
    attachment: {
        id: number;
        name: string;
        size: number;
        download_url: string;
    } | null;
    created_at: string;
    replies: PhaseActivitySummary[];
};

export type TaggableMember = {
    id: number;
    name: string;
};
