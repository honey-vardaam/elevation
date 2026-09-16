export type NotificationItem = {
    id: string;
    read_at: string | null;
    created_at: string;
    project_id: number;
    project_name: string;
    phase_id: number;
    phase_name: string;
    actor_name: string;
    message: string;
};

export type NotificationsPayload = {
    unread_count: number;
    items: NotificationItem[];
};
