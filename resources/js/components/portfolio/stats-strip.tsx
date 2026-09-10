import { Badge } from '@/components/ui/badge';
import { projectTypeLabel } from '@/components/projects/project-type-select';
import type { PortfolioStats, ProjectType } from '@/types';

function formatSqft(value: number): string {
    if (value === 0) {
        return '0';
    }

    return new Intl.NumberFormat().format(Math.round(value));
}

export function StatsStrip({ stats }: { stats: PortfolioStats }) {
    const breakdown = Object.entries(stats.type_breakdown) as [
        ProjectType | 'uncategorized',
        number,
    ][];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 text-center">
                    <p className="text-3xl font-semibold">
                        {stats.completed_count}
                    </p>
                    <p className="text-muted-foreground text-xs">
                        Completed
                    </p>
                </div>
                <div className="space-y-1 text-center">
                    <p className="text-3xl font-semibold">
                        {stats.ongoing_count}
                    </p>
                    <p className="text-muted-foreground text-xs">Ongoing</p>
                </div>
                <div className="space-y-1 text-center">
                    <p className="text-3xl font-semibold">
                        {formatSqft(stats.sqft_covered)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                        Sq ft covered
                    </p>
                </div>
            </div>

            {breakdown.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                    {breakdown.map(([type, count]) => (
                        <Badge key={type} variant="outline">
                            {type === 'uncategorized'
                                ? 'Uncategorized'
                                : projectTypeLabel(type)}{' '}
                            &middot; {count}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
