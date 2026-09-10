import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { DueReminder } from '@/types/calendar';

export function useCalendarReminders(): void {
    const dueReminders = usePage().props.dueReminders as
        | DueReminder[]
        | undefined;

    const key = (dueReminders ?? []).map((reminder) => reminder.id).join(',');

    useEffect(() => {
        for (const reminder of dueReminders ?? []) {
            const time = reminder.all_day
                ? 'today'
                : new Date(reminder.start_at).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                  });

            toast.info(`Reminder: ${reminder.title}`, {
                description: `Starting ${time}`,
            });
        }
    }, [key, dueReminders]);
}
