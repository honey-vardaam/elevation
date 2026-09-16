import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationPanel } from '@/components/notification-panel';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
    headerAction,
}: {
    breadcrumbs?: BreadcrumbItemType[];
    headerAction?: ReactNode;
}) {
    return (
        <header className="border-sidebar-border/50 ease-collapse flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] duration-[350ms] group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-7" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                {headerAction}
                <NotificationPanel />
            </div>
        </header>
    );
}
