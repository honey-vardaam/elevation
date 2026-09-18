import { router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Bell,
    BellRing,
    CheckCheck,
    CheckCircle2,
    MessageCircle,
    MoreHorizontal,
    Trash2,
    UserCheck,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clearAll, read, readAll } from '@/routes/notifications';
import { show as showProject } from '@/routes/projects';
import type {
    NotificationItem,
    NotificationsPayload,
    NotificationType,
} from '@/types/notifications';

const NOTIFICATION_TYPE_META: Record<
    NotificationType,
    { label: string; Icon: LucideIcon }
> = {
    comment: { label: 'Comment', Icon: MessageCircle },
    change_request: { label: 'Change request', Icon: AlertCircle },
    review: { label: 'Review', Icon: UserCheck },
    approved: { label: 'Approved', Icon: CheckCircle2 },
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function NotificationPanel() {
    const [open, setOpen] = useState(false);
    const notifications = usePage().props.notifications as
        | NotificationsPayload
        | undefined;
    const unreadCount = notifications?.unread_count ?? 0;
    const items = notifications?.items ?? [];

    function openNotification(notification: NotificationItem) {
        const targetUrl = showProject(notification.project_id, {
            query: { view: 'list', panel: notification.phase_id },
        }).url;

        setOpen(false);

        if (notification.read_at) {
            router.visit(targetUrl);
            return;
        }

        router.patch(
            read({ notification: notification.id }).url,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => router.visit(targetUrl),
            },
        );
    }

    function markAllAsRead() {
        router.post(
            readAll().url,
            {},
            { preserveScroll: true, preserveState: true },
        );
    }

    function clearAllNotifications() {
        router.delete(clearAll().url, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="group relative h-9 w-9 cursor-pointer"
                onClick={() => setOpen(true)}
            >
                <Bell className="!size-5 opacity-80 group-hover:opacity-100" />
                {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-600 px-1 py-0 text-[10px] font-medium leading-none text-white tabular-nums select-none dark:bg-neutral-300 dark:text-neutral-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
                <span className="sr-only">Notifications</span>
            </Button>

            <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 p-0 sm:max-w-sm"
            >
                <SheetHeader className="border-b pr-14">
                    <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>

                <Tabs
                    defaultValue="inbox"
                    className="flex min-h-0 flex-1 flex-col gap-0"
                >
                    <div className="flex items-center justify-between gap-2 border-b p-2">
                        <TabsList>
                            <TabsTrigger value="inbox">Inbox</TabsTrigger>
                            <TabsTrigger value="general">General</TabsTrigger>
                        </TabsList>
                        {items.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-muted-foreground"
                                    >
                                        <MoreHorizontal className="size-4" />
                                        <span className="sr-only">
                                            Notification actions
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {unreadCount > 0 && (
                                        <DropdownMenuItem
                                            onClick={markAllAsRead}
                                        >
                                            <CheckCheck className="size-4" />
                                            Mark all read
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        onClick={clearAllNotifications}
                                        variant="destructive"
                                    >
                                        <Trash2 className="size-4" />
                                        Clear all
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <TabsContent
                        value="inbox"
                        className="min-h-0 overflow-y-auto"
                    >
                        {items.length === 0 ? (
                            <div className="text-muted-foreground flex flex-col items-center gap-2 p-8 text-center text-sm">
                                <Bell className="size-6" />
                                You're all caught up.
                            </div>
                        ) : (
                            items.map((notification) => {
                                const typeMeta =
                                    NOTIFICATION_TYPE_META[notification.type];

                                return (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        onClick={() =>
                                            openNotification(notification)
                                        }
                                        className={`hover:bg-muted/50 flex w-full items-start gap-2 border-b p-3 text-left transition-colors ${
                                            notification.read_at
                                                ? ''
                                                : 'bg-muted/40'
                                        }`}
                                    >
                                        {!notification.read_at && (
                                            <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-muted-foreground truncate text-xs">
                                                    {notification.project_name}
                                                </p>
                                                {typeMeta && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="shrink-0"
                                                    >
                                                        <typeMeta.Icon />
                                                        {typeMeta.label}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm">
                                                {notification.message}
                                            </p>
                                            <p className="text-muted-foreground mt-0.5 text-xs">
                                                {formatDate(
                                                    notification.created_at,
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </TabsContent>

                    <TabsContent
                        value="general"
                        className="min-h-0 overflow-y-auto"
                    >
                        <div className="text-muted-foreground flex flex-col items-center gap-2 p-8 text-center text-sm">
                            <BellRing className="size-6" />
                            No general notifications yet.
                            <span className="text-xs">
                                Reminders and event updates will show up here.
                            </span>
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
