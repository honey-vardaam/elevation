import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Contact,
    FolderKanban,
    GitCompareArrows,
    Inbox,
    LayoutGrid,
    LayoutTemplate,
    Palette,
    Settings2,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { index as calendarIndex } from '@/routes/calendar';
import { index as clientsIndex } from '@/routes/clients';
import { index as comparisonsIndex } from '@/routes/comparisons';
import { edit as editCompany } from '@/routes/company';
import { index as defaultFolderTemplatesIndex } from '@/routes/default-folder-templates';
import { index as inboxIndex } from '@/routes/inbox';
import { index as moodboardsIndex } from '@/routes/moodboards';
import { index as phaseFlowTemplatesIndex } from '@/routes/phase-flow-templates';
import { index as portfoliosIndex } from '@/routes/portfolios';
import { edit as editProfile } from '@/routes/profile';
import { index as projectsIndex } from '@/routes/projects';
import { edit as editSecurity } from '@/routes/security';
import { index as teamsIndex } from '@/routes/teams';
import { index as usersIndex } from '@/routes/users';
import type { NavItem } from '@/types';

function buildMainNavItems(
    isOwner: boolean,
    unreadNotificationsCount: number = 0,
): NavItem[] {
    return [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Projects',
            href: projectsIndex(),
            icon: FolderKanban,
        },
        {
            title: 'Calendar',
            href: calendarIndex(),
            icon: CalendarDays,
        },
        {
            title: 'Moodboards',
            href: moodboardsIndex(),
            icon: Palette,
        },
        {
            title: 'Smart Comparison',
            href: comparisonsIndex(),
            icon: GitCompareArrows,
        },
        {
            title: 'Inbox',
            href: inboxIndex(),
            icon: Inbox,
            badge:
                unreadNotificationsCount > 0
                    ? unreadNotificationsCount > 99
                        ? '99+'
                        : unreadNotificationsCount
                    : null,
        },
        ...(isOwner
            ? [
                  {
                      title: 'Clients',
                      href: clientsIndex(),
                      icon: Contact,
                  },
                  {
                      title: 'Team',
                      href: usersIndex(),
                      icon: Users,
                  },
                  {
                      title: 'Portfolio',
                      href: portfoliosIndex(),
                      icon: LayoutTemplate,
                  },
              ]
            : []),
        {
            title: 'Settings',
            href: editProfile(),
            icon: Settings2,
            items: [
                { title: 'Profile', href: editProfile() },
                { title: 'Security', href: editSecurity() },
                { title: 'Appearance', href: editAppearance() },
                ...(isOwner
                    ? [
                          {
                              title: 'Company',
                              href: editCompany(),
                          },
                          {
                              title: 'Default Folders',
                              href: defaultFolderTemplatesIndex(),
                          },
                          {
                              title: 'Phase Flows',
                              href: phaseFlowTemplatesIndex(),
                          },
                          {
                              title: 'Teams',
                              href: teamsIndex(),
                          },
                      ]
                    : []),
            ],
        },
    ];
}

export function AppSidebar() {
    const { auth, notifications } = usePage().props;
    const unreadNotificationsCount = notifications?.unread_count ?? 0;
    const mainNavItems = buildMainNavItems(
        auth.user.role === 'owner',
        unreadNotificationsCount,
    );

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
