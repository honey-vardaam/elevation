import { Link } from '@inertiajs/react';
import { GanttChartSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { show } from '@/routes/projects';
import { projectStatusLabel } from '@/components/projects/project-status-select';
import type { ProjectTimelineEntry } from '@/types';

const STATUS_BAR_CLASS: Record<ProjectTimelineEntry['status'], string> = {
    ongoing: 'bg-primary',
    on_hold: 'bg-amber-500',
    completed: 'bg-emerald-500',
};

export function ProjectTimeline({
    projects,
    monthLabel,
}: {
    projects: ProjectTimelineEntry[];
    monthLabel: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Project timeline</CardTitle>
                <p className="text-muted-foreground text-sm">
                    Projects you have access to, over {monthLabel}.
                </p>
            </CardHeader>
            <CardContent>
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
                            <div key={project.id} className="space-y-1">
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
                                <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
                                    <div
                                        className={`absolute h-full rounded-full ${STATUS_BAR_CLASS[project.status]}`}
                                        style={{
                                            left: `${project.start_offset_pct}%`,
                                            width: `${Math.max(project.width_pct, 2)}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {project.start_date}
                                    {project.end_date &&
                                        ` – ${project.end_date}`}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
