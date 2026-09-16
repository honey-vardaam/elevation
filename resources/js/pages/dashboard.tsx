import { Head, Link, router } from '@inertiajs/react';
import { type FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { CardLinkRow } from '@/components/card-link-row';
import { projectStatusLabel } from '@/components/projects/project-status-select';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as calendarIndex } from '@/routes/calendar';
import { show as showProject } from '@/routes/projects';
import {
    store as storeTask,
    update as updateTask,
    destroy as destroyTask,
} from '@/routes/tasks';
import {
    store as startTimeEntry,
    stop as stopTimeEntry,
} from '@/routes/time-tracker';
import type {
    ActiveTimeEntry,
    AllottedProject,
    AttentionPhase,
    DashboardStatusCounts,
    ReminderItem,
    RecentActivityItem,
    TaskItem,
    WeeklyActivityDay,
} from '@/types';

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatElapsed(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return [h, m, s].map((value) => String(value).padStart(2, '0')).join(':');
}

function useElapsedSeconds(startedAt: string | null): number {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startedAt) {
            setElapsed(0);
            return;
        }

        const startedAtMs = new Date(startedAt).getTime();
        const tick = () =>
            setElapsed(
                Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
            );

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startedAt]);

    return elapsed;
}

function KpiCard({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: string;
    tone?: 'default' | 'warning';
}) {
    return (
        <Card
            size="sm"
            className="hover:bg-muted/40 gap-3 transition-colors md:col-span-2"
        >
            <CardContent>
                <p className="text-muted-foreground text-xs font-medium">
                    {label}
                </p>
                <p
                    className={cn(
                        'mt-1 text-3xl font-semibold tracking-tight',
                        tone === 'warning' && 'text-destructive',
                    )}
                >
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

function TimeTracker({
    activeEntry,
    projects,
}: {
    activeEntry: ActiveTimeEntry | null;
    projects: AllottedProject[];
}) {
    const [projectId, setProjectId] = useState('');
    const [task, setTask] = useState('');
    const [processing, setProcessing] = useState(false);
    const elapsed = useElapsedSeconds(activeEntry?.started_at ?? null);

    function handleStart(e: FormEvent) {
        e.preventDefault();

        if (!projectId || !task.trim()) {
            return;
        }

        setProcessing(true);
        router.post(
            startTimeEntry().url,
            { project_id: projectId, task },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setTask('');
                    setProjectId('');
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    function handleStop() {
        if (!activeEntry) {
            return;
        }

        setProcessing(true);
        router.post(
            stopTimeEntry(activeEntry.id).url,
            {},
            { preserveScroll: true, onFinish: () => setProcessing(false) },
        );
    }

    return (
        <Card size="sm" className="md:col-span-6">
            <CardHeader>
                <CardTitle>Time tracker</CardTitle>
            </CardHeader>
            <CardContent>
                {activeEntry ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate font-medium">
                                {activeEntry.task}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                                {activeEntry.project.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xl tracking-tight tabular-nums">
                                {formatElapsed(elapsed)}
                            </span>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleStop}
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Stop
                            </Button>
                        </div>
                    </div>
                ) : projects.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        You need an allotted project before you can track time.
                    </p>
                ) : (
                    <form
                        onSubmit={handleStart}
                        className="flex flex-wrap items-center gap-2"
                    >
                        <Label htmlFor="tracker-project" className="sr-only">
                            Project
                        </Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger
                                id="tracker-project"
                                className="min-w-32 flex-1"
                            >
                                <SelectValue placeholder="Project" />
                            </SelectTrigger>
                            <SelectContent>
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

                        <Label htmlFor="tracker-task" className="sr-only">
                            Task
                        </Label>
                        <Input
                            id="tracker-task"
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            placeholder="What are you working on?"
                            className="min-w-40 flex-[2]"
                        />

                        <Button
                            type="submit"
                            disabled={processing || !projectId || !task.trim()}
                        >
                            {processing && <Spinner />}
                            Start
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

function AllottedProjects({ projects }: { projects: AllottedProject[] }) {
    const getInitials = useInitials();
    const visible = projects.slice(0, 3);

    return (
        <Card size="sm" className="md:col-span-2">
            <CardHeader>
                <CardTitle>Allotted projects</CardTitle>
            </CardHeader>
            <CardContent>
                {visible.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No projects yet.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {visible.map((project) => (
                            <CardLinkRow
                                key={project.id}
                                href={showProject(project.id).url}
                                trailing={
                                    <AvatarGroup className="shrink-0">
                                        {project.members
                                            .slice(0, 3)
                                            .map((member) => (
                                                <Avatar
                                                    key={member.id}
                                                    size="sm"
                                                >
                                                    <AvatarFallback className="text-[10px] font-medium">
                                                        {getInitials(
                                                            member.name,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ))}
                                        {project.members.length > 3 && (
                                            <AvatarGroupCount>
                                                +{project.members.length - 3}
                                            </AvatarGroupCount>
                                        )}
                                    </AvatarGroup>
                                }
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <p className="truncate font-medium">
                                        {project.name}
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className="shrink-0"
                                    >
                                        {projectStatusLabel(project.status)}
                                    </Badge>
                                </div>
                            </CardLinkRow>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Reminders({ reminders }: { reminders: ReminderItem[] }) {
    return (
        <Card size="sm" className="md:col-span-2">
            <CardHeader>
                <CardTitle>Reminders</CardTitle>
                <CardDescription>
                    Your current and upcoming reminders.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {reminders.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No reminders right now.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {reminders.map((reminder) => (
                            <CardLinkRow
                                key={reminder.id}
                                href={calendarIndex().url}
                                trailing={
                                    <span className="text-muted-foreground shrink-0 text-xs">
                                        {reminder.all_day
                                            ? new Date(
                                                  reminder.start_at,
                                              ).toLocaleDateString(undefined, {
                                                  month: 'short',
                                                  day: 'numeric',
                                              })
                                            : formatDateTime(reminder.start_at)}
                                    </span>
                                }
                            >
                                <p className="truncate font-medium">
                                    {reminder.title}
                                </p>
                                {reminder.project && (
                                    <p className="text-muted-foreground truncate text-xs">
                                        {reminder.project.name}
                                    </p>
                                )}
                            </CardLinkRow>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Tasks({ tasks }: { tasks: TaskItem[] }) {
    const [title, setTitle] = useState('');
    const [processing, setProcessing] = useState(false);

    function handleAdd(e: FormEvent) {
        e.preventDefault();

        if (!title.trim()) {
            return;
        }

        setProcessing(true);
        router.post(
            storeTask().url,
            { title },
            {
                preserveScroll: true,
                onSuccess: () => setTitle(''),
                onFinish: () => setProcessing(false),
            },
        );
    }

    function handleToggle(task: TaskItem, checked: boolean) {
        router.patch(
            updateTask(task.id).url,
            { is_completed: checked },
            { preserveScroll: true },
        );
    }

    function handleDelete(task: TaskItem) {
        router.delete(destroyTask(task.id).url, { preserveScroll: true });
    }

    return (
        <Card size="sm" className="md:col-span-2">
            <CardHeader>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>Your personal to-dos.</CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={handleAdd}
                    className="mb-3 flex items-center gap-2"
                >
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Add a task"
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={processing || !title.trim()}
                    >
                        Add
                    </Button>
                </form>

                {tasks.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No tasks yet.
                    </p>
                ) : (
                    <div className="space-y-0.5">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="group flex items-center gap-3 rounded-lg px-2 py-1 text-sm"
                            >
                                <Checkbox
                                    checked={task.is_completed}
                                    onCheckedChange={(checked) =>
                                        handleToggle(task, checked === true)
                                    }
                                />
                                <span
                                    className={`min-w-0 flex-1 truncate ${
                                        task.is_completed
                                            ? 'text-muted-foreground line-through'
                                            : ''
                                    }`}
                                >
                                    {task.title}
                                </span>
                                {task.project && (
                                    <span className="text-muted-foreground shrink-0 text-xs">
                                        {task.project.name}
                                    </span>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 opacity-0 group-hover:opacity-100"
                                    onClick={() => handleDelete(task)}
                                >
                                    <X className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const STATUS_SEGMENTS = [
    {
        key: 'ongoing',
        label: 'Ongoing',
        strokeClass: 'stroke-chart-5',
        dotClass: 'bg-chart-5',
    },
    {
        key: 'on_hold',
        label: 'On Hold',
        strokeClass: 'stroke-chart-3',
        dotClass: 'bg-chart-3',
    },
    {
        key: 'completed',
        label: 'Completed',
        strokeClass: 'stroke-chart-1',
        dotClass: 'bg-chart-1',
    },
] as const;

function StatusDonut({
    statusCounts,
}: {
    statusCounts: DashboardStatusCounts;
}) {
    const total =
        statusCounts.ongoing + statusCounts.on_hold + statusCounts.completed;

    const size = 160;
    const strokeWidth = 22;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulative = 0;

    return (
        <Card size="sm" className="md:col-span-2">
            <CardHeader>
                <CardTitle>Project status</CardTitle>
                <CardDescription>
                    Across every project you have access to.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {total === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No projects yet.
                    </p>
                ) : (
                    <div className="flex flex-wrap items-center gap-6">
                        <div
                            className="relative shrink-0"
                            style={{ width: size, height: size }}
                        >
                            <svg
                                width={size}
                                height={size}
                                viewBox={`0 0 ${size} ${size}`}
                                className="-rotate-90"
                            >
                                <circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    fill="none"
                                    strokeWidth={strokeWidth}
                                    className="stroke-muted"
                                />
                                {STATUS_SEGMENTS.map((segment) => {
                                    const count = statusCounts[segment.key];
                                    if (count === 0) {
                                        return null;
                                    }

                                    const length =
                                        (count / total) * circumference;
                                    const offset = -cumulative;
                                    cumulative += length;

                                    return (
                                        <circle
                                            key={segment.key}
                                            cx={size / 2}
                                            cy={size / 2}
                                            r={radius}
                                            fill="none"
                                            strokeWidth={strokeWidth}
                                            strokeDasharray={`${length} ${circumference - length}`}
                                            strokeDashoffset={offset}
                                            className={segment.strokeClass}
                                        >
                                            <title>
                                                {`${segment.label}: ${count}`}
                                            </title>
                                        </circle>
                                    );
                                })}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-semibold tracking-tight">
                                    {total}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    Projects
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 text-sm">
                            {STATUS_SEGMENTS.map((segment) => (
                                <span
                                    key={segment.key}
                                    className="flex items-center gap-1.5"
                                >
                                    <span
                                        className={`size-2 rounded-full ${segment.dotClass}`}
                                    />
                                    {segment.label}
                                    <span className="text-muted-foreground">
                                        {statusCounts[segment.key]}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const weeklyHoursChartConfig = {
    hours: {
        label: 'Hours',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig;

function WeeklyHoursChart({ days }: { days: WeeklyActivityDay[] }) {
    const total = days.reduce((sum, d) => sum + d.hours, 0);

    return (
        <Card size="sm" className="md:col-span-2">
            <CardHeader>
                <CardTitle>Hours this week</CardTitle>
                <CardDescription>
                    {total.toFixed(1)}h logged across the last 7 days.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={weeklyHoursChartConfig}
                    className="aspect-auto h-36 w-full"
                >
                    <BarChart data={days}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />
                        <Bar
                            dataKey="hours"
                            fill="var(--color-hours)"
                            radius={4}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

const weeklyOutputChartConfig = {
    tasks_completed: {
        label: 'Tasks completed',
        color: 'var(--chart-2)',
    },
    work_items: {
        label: 'Phase activity',
        color: 'var(--chart-3)',
    },
} satisfies ChartConfig;

function WeeklyOutputChart({ days }: { days: WeeklyActivityDay[] }) {
    return (
        <Card size="sm" className="md:col-span-6">
            <CardHeader>
                <CardTitle>Weekly output</CardTitle>
                <CardDescription>
                    Tasks completed vs. phase activity, day by day.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={weeklyOutputChartConfig}
                    className="aspect-auto h-52 w-full"
                >
                    <BarChart data={days}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                            width={24}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                            dataKey="tasks_completed"
                            fill="var(--color-tasks_completed)"
                            radius={4}
                        />
                        <Bar
                            dataKey="work_items"
                            fill="var(--color-work_items)"
                            radius={4}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

function NeedsAttention({ items }: { items: AttentionPhase[] }) {
    return (
        <Card size="sm" className="md:col-span-2">
            <CardHeader>
                <CardTitle>Needs your attention</CardTitle>
                <CardDescription>
                    In-progress phases with unresolved change requests.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        Nothing needs attention right now.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => (
                            <CardLinkRow
                                key={item.phase_id}
                                href={`${showProject(item.project.id).url}?panel=${item.phase_id}`}
                                trailing={
                                    <Badge
                                        variant="destructive"
                                        className="shrink-0"
                                    >
                                        {item.open_change_requests_count}
                                    </Badge>
                                }
                            >
                                <p className="text-muted-foreground truncate text-xs">
                                    {item.project.name}
                                </p>
                                <p className="truncate font-medium">
                                    {item.phase_name}
                                </p>
                            </CardLinkRow>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function DashboardCalendar({
    reminders,
    activity,
}: {
    reminders: ReminderItem[];
    activity: RecentActivityItem[];
}) {
    const getInitials = useInitials();
    const [month, setMonth] = useState(new Date());
    const eventDays = reminders.map((r) => new Date(r.start_at));

    function goToDay(day: Date | undefined) {
        if (!day) {
            return;
        }

        router.get(calendarIndex({ query: { month: monthKey(day) } }).url);
    }

    return (
        <Card className="flex h-full flex-col gap-0 py-0">
            <div data-slot="card-content" className="shrink-0">
                <Calendar
                    mode="single"
                    month={month}
                    onMonthChange={setMonth}
                    onSelect={goToDay}
                    modifiers={{ hasEvent: eventDays }}
                    modifiersClassNames={{
                        hasEvent:
                            'after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary',
                    }}
                    className="w-full"
                />
            </div>

            <Separator className="mx-0" />

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                    Recent activity
                </p>
                {activity.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No activity yet.
                    </p>
                ) : (
                    <div className="space-y-1">
                        {activity.map((item) => (
                            <Link
                                key={item.id}
                                href={`${showProject(item.project.id).url}?panel=${item.phase.id}`}
                                className="hover:bg-muted/50 flex items-start gap-2.5 rounded-lg p-1.5 text-sm transition-colors"
                            >
                                <Avatar size="sm" className="mt-0.5 shrink-0">
                                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                                        {getInitials(item.author_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate">
                                        <span className="font-medium">
                                            {item.author_name}
                                        </span>{' '}
                                        <span className="text-muted-foreground">
                                            {item.preview}
                                        </span>
                                    </p>
                                    <p className="text-muted-foreground truncate text-xs">
                                        {item.project.name} &middot;{' '}
                                        {formatDateTime(item.created_at)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}

export default function Dashboard({
    statusCounts,
    openChangeRequestsTotal,
    needsAttention,
    recentActivity,
    reminders,
    activeTimeEntry,
    hoursTrackedToday,
    tasks,
    allottedProjects,
    weeklyActivity,
}: {
    statusCounts: DashboardStatusCounts;
    openChangeRequestsTotal: number;
    needsAttention: AttentionPhase[];
    recentActivity: RecentActivityItem[];
    reminders: ReminderItem[];
    activeTimeEntry: ActiveTimeEntry | null;
    hoursTrackedToday: number;
    tasks: TaskItem[];
    allottedProjects: AllottedProject[];
    weeklyActivity: WeeklyActivityDay[];
}) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row lg:items-start">
                <div className="grid flex-1 gap-4 md:grid-cols-6">
                    <KpiCard
                        label="Hours today"
                        value={`${hoursTrackedToday}h`}
                    />
                    <KpiCard
                        label="Active projects"
                        value={String(statusCounts.ongoing)}
                    />
                    <KpiCard
                        label="Open change requests"
                        value={String(openChangeRequestsTotal)}
                        tone={
                            openChangeRequestsTotal > 0 ? 'warning' : 'default'
                        }
                    />

                    <TimeTracker
                        activeEntry={activeTimeEntry}
                        projects={allottedProjects}
                    />

                    <AllottedProjects projects={allottedProjects} />
                    <Tasks tasks={tasks} />
                    <Reminders reminders={reminders} />

                    <NeedsAttention items={needsAttention} />
                    <StatusDonut statusCounts={statusCounts} />
                    <WeeklyHoursChart days={weeklyActivity} />

                    <WeeklyOutputChart days={weeklyActivity} />
                </div>

                <aside className="w-full lg:sticky lg:top-4 lg:h-[calc(100svh-2rem)] lg:w-72 lg:shrink-0 xl:w-80">
                    <DashboardCalendar
                        reminders={reminders}
                        activity={recentActivity}
                    />
                </aside>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
