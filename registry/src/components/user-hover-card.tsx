import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { UserAvatar } from '@/components/admin/user-avatar';
import { Badge } from '@/components/ui/badge';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

/** The user a card describes; `name` is the display name. */
export type UserHoverCardUser = {
    id: number | string;
    name: string;
    email?: string;
    avatar?: string | null;
    /** Role label shown as a badge (already translated). */
    role?: string | null;
};

type UserHoverCardProps = {
    user: UserHoverCardUser;
    /** Presence: shows Online / Offline. Omit when the app has no presence. */
    isOnline?: boolean;
    /** The trigger: an author name, a mention, an avatar. */
    children: ReactNode;
};

/**
 * A user's card on hover or focus, on shadcn `HoverCard`: avatar, name, role
 * and whether they are online. Wraps author names and mentions (externa-core
 * chat). The app passes presence (`isOnline`), read from its realtime channel.
 */
export function UserHoverCard({
    user,
    isOnline,
    children,
}: UserHoverCardProps) {
    const { t } = useTranslation();

    return (
        <HoverCard openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>{children}</HoverCardTrigger>
            <HoverCardContent
                align="start"
                className="w-64"
                data-test="user-hover-card"
            >
                <div className="flex items-center gap-3">
                    <UserAvatar
                        userId={user.id}
                        name={user.name}
                        email={user.email}
                        imageUrl={user.avatar}
                        size="lg"
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate text-sm font-medium">
                            {user.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {user.role ? (
                                <Badge variant="secondary">{user.role}</Badge>
                            ) : null}
                            {isOnline === undefined ? null : (
                                <span
                                    className="flex items-center gap-1 text-xs text-muted-foreground"
                                    data-test="user-hover-card-presence"
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'size-2 rounded-full',
                                            isOnline
                                                ? 'bg-success'
                                                : 'bg-muted-foreground',
                                        )}
                                    />
                                    {isOnline
                                        ? t('common.online')
                                        : t('common.offline')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
