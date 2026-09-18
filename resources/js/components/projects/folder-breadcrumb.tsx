import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { show } from '@/routes/projects';
import type { ProjectFolderSummary } from '@/types';

export function FolderBreadcrumb({
    projectId,
    view,
    trail,
    phaseId,
}: {
    projectId: number;
    view: 'grid' | 'list';
    trail: ProjectFolderSummary[];
    phaseId?: number | null;
}) {
    function url(folderId?: number): string {
        const params = new URLSearchParams({ view });
        if (folderId) {
            params.set('folder', String(folderId));
        }
        if (phaseId) {
            params.set('phase', String(phaseId));
        }

        return `${show(projectId).url}?${params.toString()}`;
    }

    return (
        <nav className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
            <Link
                href={url()}
                className="hover:text-foreground flex items-center gap-1"
            >
                <Home className="size-4" />
                <span>Root</span>
            </Link>

            {trail.map((folder, index) => {
                const isLast = index === trail.length - 1;

                return (
                    <Fragment key={folder.id}>
                        <ChevronRight className="size-4" />
                        {isLast ? (
                            <span className="text-foreground font-medium">
                                {folder.name}
                            </span>
                        ) : (
                            <Link
                                href={url(folder.id)}
                                className="hover:text-foreground"
                            >
                                {folder.name}
                            </Link>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
