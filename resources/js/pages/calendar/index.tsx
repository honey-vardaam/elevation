import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DaySheet } from '@/components/calendar/day-sheet';
import { EventDialog } from '@/components/calendar/event-dialog';
import { ProjectTimeline } from '@/components/calendar/project-timeline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { index } from '@/routes/calendar';
import type {
    CalendarEventSummary,
    CalendarProjectOption,
    ProjectTimelineEntry,
} from '@/types';

function toKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildGrid(month: string): Date[] {
    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    return Array.from({ length: 42 }, (_, i) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + i);
        return date;
    });
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Index({
    month,
    events,
    projects,
    projectTimeline,
}: {
    month: string;
    events: CalendarEventSummary[];
    projects: CalendarProjectOption[];
    projectTimeline: ProjectTimelineEntry[];
}) {
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthLabel = monthStart.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });
    const todayKey = toKey(new Date());

    const grid = useMemo(() => buildGrid(month), [month]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEventSummary[]>();
        for (const event of events) {
            const key = toKey(new Date(event.start_at));
            const list = map.get(key) ?? [];
            list.push(event);
            map.set(key, list);
        }
        return map;
    }, [events]);

    function goToMonth(target: string) {
        router.get(
            index({ query: { month: target } }).url,
            {},
            { preserveScroll: true },
        );
    }

    function shiftMonth(delta: number) {
        const target = new Date(year, monthNum - 1 + delta, 1);
        goToMonth(
            `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`,
        );
    }

    return (
        <>
            <Head title="Calendar" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => shiftMonth(-1)}
                        >
                            <ChevronLeft className="size-4" />
                            <span className="sr-only">Previous month</span>
                        </Button>
                        <h2 className="min-w-40 text-center text-lg font-medium">
                            {monthLabel}
                        </h2>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => shiftMonth(1)}
                        >
                            <ChevronRight className="size-4" />
                            <span className="sr-only">Next month</span>
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() =>
                                goToMonth(
                                    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
                                )
                            }
                        >
                            Today
                        </Button>
                    </div>
                    <Button onClick={() => setCreating(true)}>
                        New Event
                    </Button>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    <Card className="p-0 xl:col-span-2">
                        <div className="grid grid-cols-7 border-b">
                            {WEEKDAY_LABELS.map((label) => (
                                <div
                                    key={label}
                                    className="text-muted-foreground p-2 text-center text-xs font-medium"
                                >
                                    {label}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {grid.map((date) => {
                                const key = toKey(date);
                                const dayEvents = eventsByDay.get(key) ?? [];
                                const inMonth =
                                    date.getMonth() === monthNum - 1;
                                const isToday = key === todayKey;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedDay(key)}
                                        className={`flex min-h-24 flex-col items-stretch gap-1 border-r border-b p-1.5 text-left last:border-r-0 hover:bg-muted/50 ${
                                            inMonth
                                                ? ''
                                                : 'bg-muted/20 text-muted-foreground'
                                        }`}
                                    >
                                        <span
                                            className={`self-start text-xs ${
                                                isToday
                                                    ? 'flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground'
                                                    : ''
                                            }`}
                                        >
                                            {date.getDate()}
                                        </span>
                                        <div className="flex flex-col gap-0.5">
                                            {dayEvents
                                                .slice(0, 3)
                                                .map((event) => (
                                                    <span
                                                        key={event.id}
                                                        className="truncate rounded bg-primary/10 px-1 py-0.5 text-[11px] text-primary"
                                                    >
                                                        {event.title}
                                                    </span>
                                                ))}
                                            {dayEvents.length > 3 && (
                                                <span className="text-muted-foreground text-[11px]">
                                                    +{dayEvents.length - 3}{' '}
                                                    more
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    <ProjectTimeline
                        projects={projectTimeline}
                        monthLabel={monthLabel}
                    />
                </div>
            </div>

            <DaySheet
                date={selectedDay}
                onOpenChange={(open) => !open && setSelectedDay(null)}
                events={
                    selectedDay ? (eventsByDay.get(selectedDay) ?? []) : []
                }
                projects={projects}
            />

            <EventDialog
                open={creating}
                onOpenChange={setCreating}
                defaultDate={todayKey}
                projects={projects}
            />
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Calendar', href: index() }],
};
