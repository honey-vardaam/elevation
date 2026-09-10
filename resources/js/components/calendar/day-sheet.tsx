import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarDays, Trash2 } from 'lucide-react';
import { EventDialog } from '@/components/calendar/event-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
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
    const [deleting, setDeleting] = useState<CalendarEventSummary | null>(
        null,
    );

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
                            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center">
                                <CalendarDays className="text-muted-foreground size-6" />
                                <p className="text-muted-foreground text-sm">
                                    No events yet.
                                </p>
                            </div>
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
                                                      ).toLocaleTimeString(
                                                          [],
                                                          {
                                                              hour: 'numeric',
                                                              minute: '2-digit',
                                                          },
                                                      )}
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

            <Dialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent>
                    <DialogTitle>Delete event?</DialogTitle>
                    <p className="text-muted-foreground text-sm">
                        This permanently removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.title}
                        </span>
                        . This cannot be undone.
                    </p>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        {deleting && (
                            <Form
                                {...destroy.form(deleting.id)}
                                onSuccess={() => setDeleting(null)}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        {processing && <Spinner />}
                                        Delete event
                                    </Button>
                                )}
                            </Form>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
