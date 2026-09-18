import { Link } from '@inertiajs/react';
import { GanttChartSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { show } from '@/routes/projects';
import { projectStatusLabel } from '@/components/projects/project-status-select';
import type { ProjectTimelineEntry } from '@/types';

const STATUS_DOT_CLASS: Record<ProjectTimelineEntry['status'], string> = {
    ongoing: 'bg-chart-5',
    on_hold: 'bg-chart-3',
    completed: 'bg-chart-1',
};

function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

export function ProjectTimeline({
    projects,
    monthLabel,
}: {
    projects: ProjectTimelineEntry[];
    monthLabel: string;
}) {
    return (
        <Card className="flex h-full flex-col">
            <CardHeader>
                <CardTitle>Project timeline</CardTitle>
                <p className="text-muted-foreground text-sm">
                    Projects you have access to, over {monthLabel}.
                </p>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto">
                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center">
                        <GanttChartSquare className="text-muted-foreground size-6" />
                        <p className="text-muted-foreground text-sm">
                            No projects with dates fall in this month.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="flex items-start gap-2"
                            >
                                <span
                                    className={`mt-1.5 size-2 shrink-0 rounded-full ${STATUS_DOT_CLASS[project.status]}`}
                                />
                                <div className="min-w-0 flex-1 space-y-0.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <Link
                                            href={show(project.id)}
                                            className="truncate text-sm font-medium hover:underline"
                                        >
                                            {project.name}
                                        </Link>
                                        <Badge
                                            variant="outline"
                                            className="shrink-0 capitalize"
                                        >
                                            {projectStatusLabel(project.status)}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        {project.start_date &&
                                            formatDate(project.start_date)}
                                        {project.end_date &&
                                            ` – ${formatDate(project.end_date)}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
