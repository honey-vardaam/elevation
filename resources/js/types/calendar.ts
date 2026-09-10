import type { ProjectStatus } from '@/types/projects';

export type CalendarEventSummary = {
    id: number;
    title: string;
    description: string | null;
    start_at: string;
    end_at: string | null;
    all_day: boolean;
    remind_minutes_before: number | null;
    project: { id: number; name: string } | null;
};

export type CalendarProjectOption = {
    id: number;
    name: string;
};

export type ProjectTimelineEntry = {
    id: number;
    name: string;
    status: ProjectStatus;
    start_date: string | null;
    end_date: string | null;
    start_offset_pct: number;
    width_pct: number;
};

export type DueReminder = {
    id: number;
    title: string;
    start_at: string;
    all_day: boolean;
};
