import { useForm } from '@inertiajs/react';
import { type FormEvent, useEffect } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { store, update } from '@/routes/calendar-events';
import type { CalendarEventSummary, CalendarProjectOption } from '@/types';

const REMINDER_OPTIONS = [
    { value: 'none', label: 'No reminder' },
    { value: '0', label: 'At the time of the event' },
    { value: '10', label: '10 minutes before' },
    { value: '30', label: '30 minutes before' },
    { value: '60', label: '1 hour before' },
    { value: '1440', label: '1 day before' },
];

type FormData = {
    title: string;
    description: string;
    project_id: string;
    all_day: boolean;
    start_date: string;
    start_time: string;
    end_date: string;
    end_time: string;
    remind_minutes_before: string;
};

function emptyFormData(defaultDate?: string): FormData {
    return {
        title: '',
        description: '',
        project_id: 'none',
        all_day: false,
        start_date: defaultDate ?? '',
        start_time: '09:00',
        end_date: '',
        end_time: '',
        remind_minutes_before: 'none',
    };
}

function formDataFromEvent(event: CalendarEventSummary): FormData {
    const start = new Date(event.start_at);
    const end = event.end_at ? new Date(event.end_at) : null;

    const toDate = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const toTime = (d: Date) =>
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    return {
        title: event.title,
        description: event.description ?? '',
        project_id: event.project ? String(event.project.id) : 'none',
        all_day: event.all_day,
        start_date: toDate(start),
        start_time: toTime(start),
        end_date: end ? toDate(end) : '',
        end_time: end ? toTime(end) : '',
        remind_minutes_before:
            event.remind_minutes_before === null
                ? 'none'
                : String(event.remind_minutes_before),
    };
}

export function EventDialog({
    open,
    onOpenChange,
    event,
    defaultDate,
    projects,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event?: CalendarEventSummary | null;
    defaultDate?: string;
    projects: CalendarProjectOption[];
}) {
    const isEditing = !!event;
    const {
        data,
        setData,
        post,
        patch,
        processing,
        errors,
        reset,
        clearErrors,
        transform,
    } = useForm<FormData>(emptyFormData(defaultDate));

    useEffect(() => {
        if (!open) {
            return;
        }

        clearErrors();
        setData(event ? formDataFromEvent(event) : emptyFormData(defaultDate));
        // Deliberately re-run only when the dialog opens or the target
        // event changes - not on every defaultDate/projects re-render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, event?.id]);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        transform((formData) => ({
            ...formData,
            project_id:
                formData.project_id === 'none' ? '' : formData.project_id,
            remind_minutes_before:
                formData.remind_minutes_before === 'none'
                    ? ''
                    : formData.remind_minutes_before,
        }));

        const onSuccess = () => {
            onOpenChange(false);
            reset();
        };

        if (isEditing && event) {
            patch(update(event.id).url, { onSuccess });
        } else {
            post(store().url, { onSuccess });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>
                    {isEditing ? 'Edit event' : 'New event'}
                </DialogTitle>
                <DialogDescription>
                    {isEditing
                        ? 'Update the details for this event.'
                        : 'Add a personal event to your calendar.'}
                </DialogDescription>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="event-title">Title</Label>
                        <Input
                            id="event-title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            autoFocus
                            required
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="event-description">
                            Description
                        </Label>
                        <Textarea
                            id="event-description"
                            rows={2}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Project (optional)</Label>
                        <Select
                            value={data.project_id}
                            onValueChange={(value) =>
                                setData('project_id', value)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    No project
                                </SelectItem>
                                {projects.map((project) => (
                                    <SelectItem
                                        key={project.id}
                                        value={String(project.id)}
                                    >
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.project_id} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="event-all-day"
                            checked={data.all_day}
                            onCheckedChange={(checked) =>
                                setData('all_day', checked === true)
                            }
                        />
                        <Label htmlFor="event-all-day">All day</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="event-start-date">Start</Label>
                            <Input
                                id="event-start-date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) =>
                                    setData('start_date', e.target.value)
                                }
                                required
                            />
                            <InputError message={errors.start_date} />
                        </div>
                        {!data.all_day && (
                            <div className="grid gap-2">
                                <Label htmlFor="event-start-time">
                                    Start time
                                </Label>
                                <Input
                                    id="event-start-time"
                                    type="time"
                                    value={data.start_time}
                                    onChange={(e) =>
                                        setData('start_time', e.target.value)
                                    }
                                    required
                                />
                                <InputError message={errors.start_time} />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="event-end-date">
                                End (optional)
                            </Label>
                            <Input
                                id="event-end-date"
                                type="date"
                                value={data.end_date}
                                onChange={(e) =>
                                    setData('end_date', e.target.value)
                                }
                            />
                            <InputError message={errors.end_date} />
                        </div>
                        {!data.all_day && (
                            <div className="grid gap-2">
                                <Label htmlFor="event-end-time">
                                    End time
                                </Label>
                                <Input
                                    id="event-end-time"
                                    type="time"
                                    value={data.end_time}
                                    onChange={(e) =>
                                        setData('end_time', e.target.value)
                                    }
                                />
                                <InputError message={errors.end_time} />
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>Reminder</Label>
                        <Select
                            value={data.remind_minutes_before}
                            onValueChange={(value) =>
                                setData('remind_minutes_before', value)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {REMINDER_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError
                            message={errors.remind_minutes_before}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            {isEditing ? 'Save' : 'Add event'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
