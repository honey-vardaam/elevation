import { useState } from 'react';
import { CalendarDays, Trash2 } from 'lucide-react';
import { EventDialog } from '@/components/calendar/event-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { destroy } from '@/routes/calendar-events';
import type { CalendarEventSummary, CalendarProjectOption } from '@/types';

export function DaySheet({
    date,
    onOpenChange,
    events,
    projects,
}: {
    date: string | null;
    onOpenChange: (open: boolean) => void;
    events: CalendarEventSummary[];
    projects: CalendarProjectOption[];
}) {
    const [editing, setEditing] = useState<CalendarEventSummary | null>(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<CalendarEventSummary | null>(null);

    const label = date
        ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
          })
        : '';

    return (
        <>
            <Sheet open={date !== null} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>{label}</SheetTitle>
                        <SheetDescription>
                            Your events for this day.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 space-y-3 overflow-y-auto px-6">
                        {events.length === 0 ? (
                            <EmptyState
                                icon={CalendarDays}
                                message="No events yet."
                            />
                        ) : (
                            events.map((event) => (
                                <div
                                    key={event.id}
                                    className="rounded-lg border p-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {event.title}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {event.all_day
                                                    ? 'All day'
                                                    : new Date(
                                                          event.start_at,
                                                      ).toLocaleTimeString([], {
                                                          hour: 'numeric',
                                                          minute: '2-digit',
                                                      })}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setEditing(event)
                                                }
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() =>
                                                    setDeleting(event)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">
                                                    Delete
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                    {event.description && (
                                        <p className="text-muted-foreground mt-2 text-sm">
                                            {event.description}
                                        </p>
                                    )}
                                    {event.project && (
                                        <Badge
                                            variant="outline"
                                            className="mt-2"
                                        >
                                            {event.project.name}
                                        </Badge>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <SheetFooter>
                        <Button onClick={() => setCreating(true)}>
                            Add event
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <EventDialog
                open={creating}
                onOpenChange={setCreating}
                defaultDate={date ?? undefined}
                projects={projects}
            />

            <EventDialog
                open={editing !== null}
                onOpenChange={(open) => !open && setEditing(null)}
                event={editing}
                projects={projects}
            />

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete event?"
                description={
                    <>
                        This permanently removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.title}
                        </span>
                        . This cannot be undone.
                    </>
                }
                confirmLabel="Delete event"
                formAction={deleting ? destroy.form(deleting.id) : undefined}
                onSuccess={() => setDeleting(null)}
            />
        </>
    );
}
