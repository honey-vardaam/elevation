import { Head, Link, router } from '@inertiajs/react';
import { type FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, Clock, FolderKanban, X } from 'lucide-react';
import {
    Label as RechartsLabel,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from 'recharts';
import {
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { type ChartConfig, ChartContainer } from '@/components/ui/chart';
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
import { Spinner } from '@/components/ui/spinner';
import { CardLinkRow } from '@/components/card-link-row';
import { projectStatusLabel } from '@/components/projects/project-status-select';
import { useInitials } from '@/hooks/use-initials';
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
    icon: Icon,
    label,
    value,
    tone = 'default',
}: {
    icon: typeof AlertTriangle;
    label: string;
    value: string;
    tone?: 'default' | 'warning';
}) {
    return (
        <Card
            className={`group transition-colors duration-500 ease-out ${
                tone === 'warning' ? 'hover:bg-destructive' : 'hover:bg-chart-2'
            }`}
        >
            <CardContent className="flex items-center gap-3">
                <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-500 ease-out ${
                        tone === 'warning'
                            ? 'bg-destructive/10 text-destructive group-hover:bg-white/15 group-hover:text-white'
                            : 'bg-muted text-muted-foreground group-hover:bg-white/15 group-hover:text-white'
                    }`}
                >
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-2xl font-semibold tracking-tight transition-colors duration-500 ease-out group-hover:text-white">
                        {value}
                    </p>
                    <p className="text-muted-foreground text-xs transition-colors duration-500 ease-out group-hover:text-white/80">
                        {label}
                    </p>
                </div>
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
        <Card>
            <CardHeader>
                <CardTitle>Time tracker</CardTitle>
                <CardDescription>
                    {activeEntry
                        ? 'Currently tracking'
                        : 'Start tracking without leaving the dashboard.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {activeEntry ? (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="truncate font-medium">
                                {activeEntry.task}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                                {activeEntry.project.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-mono text-2xl tracking-tight tabular-nums">
                                {formatElapsed(elapsed)}
                            </span>
                            <Button
                                type="button"
                                variant="destructive"
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
                        className="flex flex-wrap items-end gap-3"
                    >
                        <div className="grid min-w-40 flex-1 gap-2">
                            <Label htmlFor="tracker-project">Project</Label>
                            <Select
                                value={projectId}
                                onValueChange={setProjectId}
                            >
                                <SelectTrigger
                                    id="tracker-project"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Select a project" />
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
                        </div>
                        <div className="grid min-w-48 flex-[2] gap-2">
                            <Label htmlFor="tracker-task">Task</Label>
                            <Input
                                id="tracker-task"
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                                placeholder="What are you working on?"
                            />
                        </div>
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Allotted projects</CardTitle>
                <CardDescription>
                    Jump straight into your active work.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {projects.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No projects yet.
                    </p>
                ) : (
                    <div className="space-y-2">
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
                                <p className="truncate font-medium">
                                    {project.name}
                                </p>
                                <Badge variant="outline" className="mt-1">
                                    {projectStatusLabel(project.status)}
                                </Badge>
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
        <Card>
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

function intensityClass(hours: number, maxHours: number): string {
    if (hours <= 0) {
        return 'bg-muted';
    }

    const ratio = hours / maxHours;

    if (ratio > 0.75) {
        return 'bg-chart-5';
    }
    if (ratio > 0.5) {
        return 'bg-chart-4';
    }
    if (ratio > 0.25) {
        return 'bg-chart-3';
    }

    return 'bg-chart-2';
}

function WeeklyActivity({ days }: { days: WeeklyActivityDay[] }) {
    const [hovered, setHovered] = useState<string | null>(null);
    const maxHours = Math.max(1, ...days.map((day) => day.hours));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Weekly activity</CardTitle>
                <CardDescription>
                    Your work over the last 7 days.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between gap-2">
                    {days.map((day) => (
                        <div
                            key={day.date}
                            className="relative flex flex-1 flex-col items-center gap-2"
                            onMouseEnter={() => setHovered(day.date)}
                            onMouseLeave={() =>
                                setHovered((current) =>
                                    current === day.date ? null : current,
                                )
                            }
                        >
                            {hovered === day.date && (
                                <div className="bg-popover text-popover-foreground absolute bottom-full z-10 mb-2 w-max max-w-40 rounded-lg border p-2 text-xs shadow-md">
                                    <p className="font-medium">
                                        {day.hours}h tracked
                                    </p>
                                    <p className="text-muted-foreground">
                                        {day.tasks_completed} tasks completed
                                    </p>
                                    <p className="text-muted-foreground">
                                        {day.work_items} work items
                                    </p>
                                </div>
                            )}
                            <div className="flex h-24 w-full items-end">
                                <div
                                    className={`w-full rounded-t-md transition-[height,background-color] duration-300 ${intensityClass(day.hours, maxHours)}`}
                                    style={{
                                        height: `${Math.max(8, (day.hours / maxHours) * 100)}%`,
                                    }}
                                />
                            </div>
                            <span className="text-muted-foreground text-xs">
                                {day.label}
                            </span>
                        </div>
                    ))}
                </div>
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
        <Card>
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
                    <div className="space-y-1">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="group flex items-center gap-3 rounded-lg p-2 text-sm"
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
        <Card>
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

const progressChartConfig = {
    progress: {
        label: 'Progress',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig;

function ProjectProgress({ progress }: { progress: number }) {
    const chartData = [
        { name: 'progress', value: progress, fill: 'var(--color-progress)' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project progress</CardTitle>
                <CardDescription>
                    Phases completed across your projects.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={progressChartConfig}
                    className="mx-auto aspect-[2/1] max-h-40"
                >
                    <RadialBarChart
                        data={chartData}
                        startAngle={180}
                        endAngle={0}
                        innerRadius={70}
                        outerRadius={100}
                    >
                        <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />
                        <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="first:fill-muted last:fill-background"
                            polarRadius={[78, 62]}
                        />
                        <RadialBar
                            dataKey="value"
                            background
                            cornerRadius={10}
                        />
                        <PolarRadiusAxis
                            tick={false}
                            tickLine={false}
                            axisLine={false}
                        >
                            <RechartsLabel
                                content={({ viewBox }) => {
                                    if (
                                        viewBox &&
                                        'cx' in viewBox &&
                                        'cy' in viewBox
                                    ) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy ?? 0) - 6}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {progress}%
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy ?? 0) + 16}
                                                    className="fill-muted-foreground text-xs"
                                                >
                                                    Complete
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

function NeedsAttention({ items }: { items: AttentionPhase[] }) {
    return (
        <Card>
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

function RecentActivity({ items }: { items: RecentActivityItem[] }) {
    const getInitials = useInitials();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>
                    What's been happening across your projects.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No activity yet.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <Link
                                key={item.id}
                                href={`${showProject(item.project.id).url}?panel=${item.phase.id}`}
                                className="hover:bg-chart-1/10 flex items-start gap-3 rounded-lg p-2 text-sm transition-colors"
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
                                        {item.phase.name} &middot;{' '}
                                        {formatDateTime(item.created_at)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
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
    projectProgress,
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
    projectProgress: number;
}) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                    <KpiCard
                        icon={Clock}
                        label="Hours today"
                        value={`${hoursTrackedToday}h`}
                    />
                    <KpiCard
                        icon={FolderKanban}
                        label="Active projects"
                        value={String(statusCounts.ongoing)}
                    />
                    <KpiCard
                        icon={AlertTriangle}
                        label="Open change requests"
                        value={String(openChangeRequestsTotal)}
                        tone={
                            openChangeRequestsTotal > 0 ? 'warning' : 'default'
                        }
                    />
                </div>

                <TimeTracker
                    activeEntry={activeTimeEntry}
                    projects={allottedProjects}
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <AllottedProjects projects={allottedProjects} />
                    <Reminders reminders={reminders} />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <WeeklyActivity days={weeklyActivity} />
                    <Tasks tasks={tasks} />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <NeedsAttention items={needsAttention} />
                    <StatusDonut statusCounts={statusCounts} />
                    <ProjectProgress progress={projectProgress} />
                </div>

                <RecentActivity items={recentActivity} />
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
