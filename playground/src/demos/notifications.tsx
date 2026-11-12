import { CircleAlert, FileWarning, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import {
    Sidebar,
    SidebarHeader,
    SidebarProvider,
} from '@/components/ui/sidebar';
import type {
    NotificationItem,
    NotificationsSource,
} from '@/lib/notifications-api';

const MINUTE_MS = 60_000;

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
    {
        id: 'finding',
        icon: CircleAlert,
        title: '30 new findings in Billing API',
        body: 'The nightly report raised 2 critical findings.',
        link: '#/',
        time: new Date(Date.now() - 5 * MINUTE_MS).toISOString(),
        isRead: false,
    },
    {
        id: 'chat',
        icon: MessageCircle,
        title: 'New message',
        body: 'Anna: can you check the invoice export?',
        link: '#/chat',
        time: new Date(Date.now() - 50 * MINUTE_MS).toISOString(),
        isRead: false,
    },
    {
        id: 'zip',
        icon: FileWarning,
        title: 'Zip preparation failed',
        time: new Date(Date.now() - 26 * 60 * MINUTE_MS).toISOString(),
        isRead: true,
    },
];

/** An in-memory source standing in for the Laravel endpoints. */
function createDemoSource(): NotificationsSource {
    let notifications = INITIAL_NOTIFICATIONS;
    const countUnread = () =>
        notifications.filter((notification) => !notification.isRead).length;
    const setRead = (ids: string[] | 'all', isRead: boolean) => {
        notifications = notifications.map((notification) =>
            ids === 'all' || ids.includes(notification.id)
                ? { ...notification, isRead }
                : notification,
        );

        return Promise.resolve(countUnread());
    };

    return {
        fetchNotifications: () => Promise.resolve(notifications),
        fetchUnreadCount: () => Promise.resolve(countUnread()),
        markRead: (ids) => setRead(ids, true),
        markUnread: (ids) => setRead(ids, false),
    };
}

/** The bell in the sidebar header, under the logo; the drawer opens on the right. */
export default function NotificationsDemo() {
    const [source] = useState(createDemoSource);

    return (
        <SidebarProvider className="min-h-0 w-auto">
            <Sidebar collapsible="none" className="rounded-md border">
                <SidebarHeader>
                    <NotificationsBell source={source} unreadCount={2} />
                </SidebarHeader>
            </Sidebar>
        </SidebarProvider>
    );
}
