import type { ProjectStatus } from '@/types/projects';

export type DashboardStatusCounts = {
    ongoing: number;
    on_hold: number;
    completed: number;
};

export type AttentionPhase = {
    phase_id: number;
    phase_name: string;
    project: { id: number; name: string };
    open_change_requests_count: number;
};

export type RecentActivityItem = {
    id: number;
    author_name: string;
    preview: string;
    project: { id: number; name: string };
    phase: { id: number; name: string };
    created_at: string;
};

export type ReminderItem = {
    id: number;
    title: string;
    start_at: string;
    all_day: boolean;
    project: { id: number; name: string } | null;
};

export type ActiveTimeEntry = {
    id: number;
    task: string;
    started_at: string;
    paused_at: string | null;
    project: { id: number; name: string };
};

export type RecentTimeEntry = {
    id: number;
    task: string;
    project: { id: number; name: string };
    ended_at: string;
    duration_seconds: number;
};

export type TaskItem = {
    id: number;
    title: string;
    is_completed: boolean;
    project: { id: number; name: string } | null;
};

export type AllottedProject = {
    id: number;
    name: string;
    status: ProjectStatus;
    members: { id: number; name: string }[];
};

export type WeeklyHours = {
    days: { date: string; label: string; hours: number }[];
    total: number;
    weeksAgo: number;
    rangeLabel: string;
};

export type WeeklyActivityDay = {
    date: string;
    label: string;
    hours: number;
    tasks_completed: number;
    work_items: number;
};

export type WeeklyComparison = {
    hours_delta_pct: number | null;
    tasks_delta: number;
    work_items_delta: number;
};

export type OwnerStats = {
    clientsCount: number;
    teamCount: number;
};
