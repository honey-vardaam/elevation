export type ActivityFeedAction =
    | { type: 'scroll_to_chat'; phase_id: number }
    | { type: 'open_phase_dialog'; phase_id: number }
    | { type: 'open_folder'; folder_id: number | null };

export type ActivityFeedItem = {
    id: string;
    kind: 'project' | 'phase';
    type: string;
    summary: string;
    actor: { id: number; name: string } | null;
    created_at: string;
    action: ActivityFeedAction | null;
};
