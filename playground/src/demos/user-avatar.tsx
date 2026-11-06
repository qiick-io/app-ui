import { UserAvatar } from '@/components/admin/user-avatar';
import { ConnectionDot } from '@/components/realtime/connection-dot';
import type { ConnectionState } from '@/components/realtime/connection-dot';
import {
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
} from '@/components/ui/avatar';
import { avatarToneClass } from '@/lib/avatar-tone';
import { cn } from '@/lib/utils';

const STATES: ConnectionState[] = [
    'connected',
    'connecting',
    'disabled',
    'offline',
];

const MEMBERS = [
    { id: 11, name: 'Kira Pellegrini' },
    { id: 12, name: 'Leo Benedetti' },
    { id: 13, name: 'Nora Testa' },
];

export default function UserAvatarDemo() {
    return (
        <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                    <UserAvatar userId={1} name="Elena Marchetti" isOnline />
                    <span className="font-medium">Elena Marchetti</span>
                </span>
                <span className="flex items-center gap-2">
                    <UserAvatar
                        userId={2}
                        name="Luca Bianchi"
                        isOnline={false}
                    />
                    <span className="font-medium">Luca Bianchi</span>
                </span>
                <span className="flex items-center gap-2">
                    <UserAvatar userId={3} name="" email="ops@example.com" />
                    <span className="font-medium">ops@example.com</span>
                </span>
            </div>
            <div className="flex items-center gap-2">
                <AvatarGroup>
                    {MEMBERS.map((member) => (
                        <UserAvatar
                            key={member.id}
                            userId={member.id}
                            name={member.name}
                        />
                    ))}
                    <AvatarGroupCount className="text-xs">+3</AvatarGroupCount>
                </AvatarGroup>
                <span className="text-muted-foreground">
                    group members, no presence
                </span>
            </div>
            <div className="flex items-center gap-4 rounded-md bg-sidebar p-3">
                {STATES.map((state) => (
                    <span key={state} className="flex items-center gap-2">
                        <Avatar>
                            <AvatarFallback
                                className={cn(
                                    avatarToneClass(4),
                                    'text-xs font-medium',
                                )}
                            >
                                EM
                            </AvatarFallback>
                            <ConnectionDot
                                state={state}
                                className="ring-sidebar"
                            />
                        </Avatar>
                        <span className="text-muted-foreground">{state}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
