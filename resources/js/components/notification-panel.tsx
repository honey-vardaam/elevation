import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { read, readAll } from '@/routes/notifications';
import { show as showProject } from '@/routes/projects';
import type {
    NotificationItem,
    NotificationsPayload,
} from '@/types/notifications';

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
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
                <span className="sr-only">Notifications</span>
            </Button>

            <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 p-0 sm:max-w-sm"
            >
                <SheetHeader className="flex-row items-center justify-between border-b pr-14">
                    <SheetTitle>Notifications</SheetTitle>
                    {unreadCount > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={markAllAsRead}
                        >
                            <CheckCheck className="size-4" />
                            Mark all read
                        </Button>
                    )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="text-muted-foreground flex flex-col items-center gap-2 p-8 text-center text-sm">
                            <Bell className="size-6" />
                            You're all caught up.
                        </div>
                    ) : (
                        items.map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                onClick={() => openNotification(notification)}
                                className={`hover:bg-muted/50 flex w-full items-start gap-2 border-b p-3 text-left transition-colors ${
                                    notification.read_at ? '' : 'bg-muted/40'
                                }`}
                            >
                                {!notification.read_at && (
                                    <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-muted-foreground truncate text-xs">
                                        {notification.project_name}
                                    </p>
                                    <p className="text-sm">
                                        {notification.message}
                                    </p>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        {formatDate(notification.created_at)}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
