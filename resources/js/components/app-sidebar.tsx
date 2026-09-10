import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarDays,
    Contact,
    FolderGit2,
    FolderKanban,
    LayoutGrid,
    Settings2,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
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
import { edit as editProfile } from '@/routes/profile';
import { index as projectsIndex } from '@/routes/projects';
import { edit as editSecurity } from '@/routes/security';
import { index as usersIndex } from '@/routes/users';
import type { NavItem } from '@/types';

function buildMainNavItems(isOwner: boolean): NavItem[] {
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
            ],
        },
    ];
}

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const mainNavItems = buildMainNavItems(auth.user.role === 'owner');

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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
