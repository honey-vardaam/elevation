import { Head, Link, router } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import {
    AlertCircle,
    Bell,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    FolderKanban,
    History,
    ListTodo,
    type LucideIcon,
    Minus,
    Pause,
    Play,
    Square,
    TrendingDown,
    TrendingUp,
    X,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from 'recharts';
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
    CardAction,
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
import { EmptyState } from '@/components/empty-state';
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
    pause as pauseTimeEntry,
    resume as resumeTimeEntry,
    store as startTimeEntry,
    stop as stopTimeEntry,
} from '@/routes/time-tracker';
import type {
    ActiveTimeEntry,
    AllottedProject,
    AttentionPhase,
    DashboardStatusCounts,
    RecentTimeEntry,
    ReminderItem,
    RecentActivityItem,
    TaskItem,
    WeeklyActivityDay,
    WeeklyComparison,
    WeeklyHours,
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

function formatDurationShort(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    if (h > 0) {
        return `${h}h ${m}m`;
    }
    if (m > 0) {
        return `${m}m`;
    }

    return `${totalSeconds}s`;
}

function useElapsedSeconds(
    startedAt: string | null,
    pausedAt: string | null = null,
): number {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startedAt) {
            setElapsed(0);
            return;
        }

        const startedAtMs = new Date(startedAt).getTime();

        if (pausedAt) {
            // Frozen while paused - no ticking interval needed.
            const pausedAtMs = new Date(pausedAt).getTime();
            setElapsed(
                Math.max(0, Math.floor((pausedAtMs - startedAtMs) / 1000)),
            );
            return;
        }

        const tick = () =>
            setElapsed(
                Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
            );

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startedAt, pausedAt]);

    return elapsed;
}

function KpiCard({
    label,
    value,
    description,
    icon: Icon,
    trend,
    back,
    tone = 'default',
}: {
    label: string;
    value: string;
    description?: string;
    icon?: LucideIcon;
    trend?: { label: string; direction: 'up' | 'down' | 'flat' };
    back?: ReactNode;
    tone?: 'default' | 'warning';
}) {
    const [flipped, setFlipped] = useState(false);
    const TrendIcon =
        trend?.direction === 'up'
            ? TrendingUp
            : trend?.direction === 'down'
              ? TrendingDown
              : Minus;

    return (
        <div className="h-36 [perspective:1200px] md:col-span-2">
            <button
                type="button"
                onClick={() => setFlipped((current) => !current)}
                aria-label={
                    flipped
                        ? `Show ${label} summary`
                        : `Show more about ${label}`
                }
                className="relative block size-full text-left transition-transform duration-500 [transform-style:preserve-3d]"
                style={{ transform: flipped ? 'rotateY(180deg)' : undefined }}
            >
                <Card
                    size="sm"
                    className="hover:bg-muted/40 absolute inset-0 gap-1 py-4 transition-colors [backface-visibility:hidden]"
                >
                    <CardContent className="flex h-full flex-col">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {Icon && (
                                    <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg">
                                        <Icon className="size-3.5" />
                                    </span>
                                )}
                                <p className="text-muted-foreground text-xs font-medium">
                                    {label}
                                </p>
                            </div>
                            {trend && (
                                <span
                                    className={cn(
                                        'inline-flex shrink-0 items-center gap-1 text-xs font-medium',
                                        trend.direction === 'flat' &&
                                            'text-muted-foreground',
                                    )}
                                >
                                    <TrendIcon className="size-3" />
                                    {trend.label}
                                </span>
                            )}
                        </div>

                        <div className="flex-1" />

                        <div className="space-y-0.5">
                            <p
                                className={cn(
                                    'text-4xl font-semibold tracking-tight',
                                    tone === 'warning' && 'text-destructive',
                                )}
                            >
                                {value}
                            </p>
                            {description && (
                                <p className="text-muted-foreground text-xs">
                                    {description}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    size="sm"
                    className="bg-muted/40 absolute inset-0 [transform:rotateY(180deg)] gap-1 py-4 [backface-visibility:hidden]"
                >
                    <CardContent className="flex flex-1 flex-col justify-center">
                        {back ?? (
                            <p className="text-muted-foreground text-xs">
                                No additional details.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </button>
        </div>
    );
}

function TimeTracker({
    activeEntry,
    projects,
    recentEntries,
}: {
    activeEntry: ActiveTimeEntry | null;
    projects: AllottedProject[];
    recentEntries: RecentTimeEntry[];
}) {
    const [projectId, setProjectId] = useState('');
    const [task, setTask] = useState('');
    const [processing, setProcessing] = useState(false);
    const isPaused = activeEntry?.paused_at != null;
    const elapsed = useElapsedSeconds(
        activeEntry?.started_at ?? null,
        activeEntry?.paused_at ?? null,
    );

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

    function handleTogglePause() {
        if (!activeEntry) {
            return;
        }

        setProcessing(true);
        router.post(
            (isPaused ? resumeTimeEntry : pauseTimeEntry)(activeEntry.id).url,
            {},
            { preserveScroll: true, onFinish: () => setProcessing(false) },
        );
    }

    return (
        <Card size="sm" className="h-72 md:col-span-2">
            <CardHeader>
                <CardTitle>Time tracker</CardTitle>
                <CardDescription>
                    Track time against your allotted projects.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                {activeEntry ? (
                    <div className="flex flex-col items-center gap-4 py-2 text-center">
                        <div className="max-w-full min-w-0">
                            <p className="truncate font-medium">
                                {activeEntry.task}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                                {activeEntry.project.name}
                                {isPaused && ' · Paused'}
                            </p>
                        </div>

                        <span
                            className={cn(
                                'font-mono text-4xl font-semibold tracking-tight tabular-nums',
                                isPaused && 'text-muted-foreground',
                            )}
                        >
                            {formatElapsed(elapsed)}
                        </span>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon-lg"
                                className="rounded-full"
                                onClick={handleTogglePause}
                                disabled={processing}
                                aria-label={
                                    isPaused
                                        ? 'Resume tracking'
                                        : 'Pause tracking'
                                }
                            >
                                {isPaused ? (
                                    <Play className="fill-current" />
                                ) : (
                                    <Pause className="fill-current" />
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-lg"
                                className="bg-chart-2 hover:bg-chart-2/90 rounded-full text-white"
                                onClick={handleStop}
                                disabled={processing}
                                aria-label="Stop tracking"
                            >
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <Square className="fill-current" />
                                )}
                            </Button>
                        </div>
                    </div>
                ) : projects.length === 0 ? (
                    <EmptyState
                        icon={FolderKanban}
                        message="You need an allotted project before you can track time."
                    />
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

                {!activeEntry && recentEntries.length > 0 && (
                    <div className="mt-4 space-y-1.5 border-t pt-3">
                        <p className="text-muted-foreground text-xs font-medium">
                            Recent
                        </p>
                        {recentEntries.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between gap-2"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {entry.task}
                                    </p>
                                    <p className="text-muted-foreground truncate text-xs">
                                        {entry.project.name}
                                    </p>
                                </div>
                                <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                                    {formatDurationShort(
                                        entry.duration_seconds,
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AllottedProjects({ projects }: { projects: AllottedProject[] }) {
    const getInitials = useInitials();

    return (
        <Card size="sm" className="h-80 md:col-span-2">
            <CardHeader>
                <CardTitle>Allotted projects</CardTitle>
                <CardDescription>
                    Projects you&rsquo;re currently assigned to.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">
                {projects.length === 0 ? (
                    <EmptyState
                        icon={FolderKanban}
                        message="No projects yet."
                    />
                ) : (
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                        {projects.map((project) => (
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
        <Card size="sm" className="h-80 md:col-span-2">
            <CardHeader>
                <CardTitle>Reminders</CardTitle>
                <CardDescription>
                    Your current and upcoming reminders.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">
                {reminders.length === 0 ? (
                    <EmptyState icon={Bell} message="No reminders right now." />
                ) : (
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
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

function TodoList({ tasks }: { tasks: TaskItem[] }) {
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
        <Card size="sm" className="h-72 md:col-span-2">
            <CardHeader>
                <CardTitle>Checklist</CardTitle>
                <CardDescription>Quick personal tasks.</CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">
                <form
                    onSubmit={handleAdd}
                    className="mb-3 flex shrink-0 items-center gap-2"
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
                    <EmptyState icon={ListTodo} message="No tasks yet." />
                ) : (
                    <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
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
        <Card size="sm" className="h-80 md:col-span-2">
            <CardHeader>
                <CardTitle>Project status</CardTitle>
                <CardDescription>
                    Across every project you have access to.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center justify-center">
                {total === 0 ? (
                    <EmptyState
                        icon={FolderKanban}
                        message="No projects yet."
                    />
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

function WeeklyHoursChart({ data }: { data: WeeklyHours }) {
    const [pending, setPending] = useState(false);

    function goToWeek(weeksAgo: number) {
        if (weeksAgo < 0 || pending) {
            return;
        }

        setPending(true);
        router.get(
            dashboard().url,
            { weeks_ago: weeksAgo },
            {
                only: ['weeklyHours'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onFinish: () => setPending(false),
            },
        );
    }

    const weekLabel =
        data.weeksAgo === 0
            ? 'This week'
            : data.weeksAgo === 1
              ? 'Last week'
              : `${data.weeksAgo} weeks ago`;

    return (
        <Card size="sm" className="h-72 justify-between md:col-span-2">
            <CardHeader>
                <CardTitle>Hours per week</CardTitle>
                <CardDescription>
                    {data.total.toFixed(1)}h logged, {data.rangeLabel}
                </CardDescription>
                <CardAction className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => goToWeek(data.weeksAgo + 1)}
                        disabled={pending}
                        aria-label="Previous week"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-muted-foreground min-w-20 text-center text-xs font-medium">
                        {weekLabel}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => goToWeek(data.weeksAgo - 1)}
                        disabled={pending || data.weeksAgo === 0}
                        aria-label="Next week"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={weeklyHoursChartConfig}
                    className="aspect-auto h-36 w-full"
                >
                    <BarChart data={data.days}>
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
        <Card size="sm" className="md:col-span-4">
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
                    <AreaChart data={days}>
                        <defs>
                            <linearGradient
                                id="fillTasksCompleted"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-tasks_completed)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-tasks_completed)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                            <linearGradient
                                id="fillWorkItems"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-work_items)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-work_items)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                        </defs>
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
                        <Area
                            type="monotone"
                            dataKey="tasks_completed"
                            stroke="var(--color-tasks_completed)"
                            fill="url(#fillTasksCompleted)"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="work_items"
                            stroke="var(--color-work_items)"
                            fill="url(#fillWorkItems)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

function NeedsAttention({ items }: { items: AttentionPhase[] }) {
    return (
        <Card size="sm" className="flex flex-col md:col-span-2">
            <CardHeader>
                <CardTitle>Needs your attention</CardTitle>
                <CardDescription>
                    In-progress phases with unresolved change requests.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">
                {items.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        message="Nothing needs attention right now."
                    />
                ) : (
                    <div className="max-h-52 space-y-2 overflow-y-auto">
                        {items.map((item) => (
                            <CardLinkRow
                                key={item.phase_id}
                                href={`${showProject(item.project.id).url}?panel=${item.phase_id}`}
                                trailing={
                                    <Badge
                                        variant="secondary"
                                        className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 py-0 text-xs leading-none font-medium tabular-nums"
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
                    classNames={{
                        today: '[&>button]:bg-chart-1 [&>button]:text-neutral-950 [&>button]:font-semibold [&>button]:hover:bg-chart-1/80 [&>button]:hover:text-neutral-950 [&>button]:hover:rounded-full',
                    }}
                    className="w-full"
                />
            </div>

            <Separator className="mx-0" />

            <div className="flex min-h-0 flex-1 flex-col p-4">
                <p className="text-muted-foreground mb-3 shrink-0 text-xs font-medium">
                    Recent activity
                </p>
                {activity.length === 0 ? (
                    <EmptyState icon={History} message="No activity yet." />
                ) : (
                    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                        {activity.map((item) => (
                            <Link
                                key={item.id}
                                href={`${showProject(item.project.id).url}?panel=${item.phase.id}`}
                                className="hover:bg-muted/50 flex gap-3 rounded-lg px-2 transition-colors"
                            >
                                <div className="flex w-8 shrink-0 items-start justify-center py-3.5">
                                    <Avatar className="shrink-0">
                                        <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                                            {getInitials(item.author_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="min-w-0 flex-1 py-3.5">
                                    <p className="truncate text-sm font-medium">
                                        {item.author_name}
                                    </p>
                                    <p className="mt-0.5 truncate text-sm">
                                        {item.preview}
                                    </p>
                                    <p className="text-muted-foreground mt-2 truncate text-xs">
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
    recentTimeEntries,
    hoursTrackedToday,
    tasks,
    allottedProjects,
    weeklyActivity,
    weeklyComparison,
    weeklyHours,
}: {
    statusCounts: DashboardStatusCounts;
    openChangeRequestsTotal: number;
    needsAttention: AttentionPhase[];
    recentActivity: RecentActivityItem[];
    reminders: ReminderItem[];
    activeTimeEntry: ActiveTimeEntry | null;
    recentTimeEntries: RecentTimeEntry[];
    hoursTrackedToday: number;
    tasks: TaskItem[];
    allottedProjects: AllottedProject[];
    weeklyActivity: WeeklyActivityDay[];
    weeklyComparison: WeeklyComparison;
    weeklyHours: WeeklyHours;
}) {
    const weeklyHoursTotal = weeklyActivity.reduce(
        (sum, day) => sum + day.hours,
        0,
    );
    const totalProjects =
        statusCounts.ongoing + statusCounts.on_hold + statusCounts.completed;

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row lg:items-start">
                <div className="grid flex-1 content-start gap-4 md:grid-cols-6">
                    <KpiCard
                        label="Hours today"
                        value={`${hoursTrackedToday}h`}
                        description="Tracked across all projects"
                        icon={Clock}
                        trend={
                            weeklyComparison.hours_delta_pct === null
                                ? undefined
                                : {
                                      label: `${weeklyComparison.hours_delta_pct > 0 ? '+' : ''}${weeklyComparison.hours_delta_pct}% wk`,
                                      direction:
                                          weeklyComparison.hours_delta_pct > 0
                                              ? 'up'
                                              : weeklyComparison.hours_delta_pct <
                                                  0
                                                ? 'down'
                                                : 'flat',
                                  }
                        }
                        back={
                            <>
                                <p className="text-muted-foreground text-xs font-medium">
                                    This week
                                </p>
                                <p className="mt-2.5 text-3xl font-semibold tracking-tight">
                                    {weeklyHoursTotal.toFixed(1)}h
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Total hours logged, last 7 days
                                </p>
                            </>
                        }
                    />
                    <KpiCard
                        label="Active projects"
                        value={String(statusCounts.ongoing)}
                        description={`of ${totalProjects} total project${totalProjects === 1 ? '' : 's'}`}
                        icon={FolderKanban}
                        back={
                            <>
                                <p className="text-muted-foreground text-xs font-medium">
                                    Breakdown
                                </p>
                                <p className="mt-2.5 text-sm">
                                    <span className="font-medium">
                                        {statusCounts.on_hold}
                                    </span>{' '}
                                    on hold
                                </p>
                                <p className="mt-1 text-sm">
                                    <span className="font-medium">
                                        {statusCounts.completed}
                                    </span>{' '}
                                    completed
                                </p>
                            </>
                        }
                    />
                    <KpiCard
                        label="Open change requests"
                        value={String(openChangeRequestsTotal)}
                        description={
                            needsAttention.length > 0
                                ? `Across ${needsAttention.length} phase${needsAttention.length === 1 ? '' : 's'}`
                                : 'Needs resolution'
                        }
                        tone={
                            openChangeRequestsTotal > 0 ? 'warning' : 'default'
                        }
                        icon={AlertCircle}
                        back={
                            <>
                                <p className="text-muted-foreground text-xs font-medium">
                                    Affected phases
                                </p>
                                <p className="mt-2.5 text-3xl font-semibold tracking-tight">
                                    {needsAttention.length}
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    See &ldquo;Needs your attention&rdquo; below
                                </p>
                            </>
                        }
                    />

                    <AllottedProjects projects={allottedProjects} />
                    <StatusDonut statusCounts={statusCounts} />
                    <Reminders reminders={reminders} />

                    <TodoList tasks={tasks} />
                    <WeeklyHoursChart data={weeklyHours} />
                    <TimeTracker
                        activeEntry={activeTimeEntry}
                        projects={allottedProjects}
                        recentEntries={recentTimeEntries}
                    />

                    <WeeklyOutputChart days={weeklyActivity} />
                    <NeedsAttention items={needsAttention} />
                </div>

                <aside className="w-full lg:sticky lg:top-20 lg:h-[calc(100svh-6rem)] lg:w-72 lg:shrink-0 xl:w-80">
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
