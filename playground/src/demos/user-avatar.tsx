import { UserAvatar } from '@/components/admin/user-avatar';
import { ConnectionDot } from '@/components/realtime/connection-dot';
import type { ConnectionState } from '@/components/realtime/connection-dot';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const STATES: ConnectionState[] = [
    'connected',
    'connecting',
    'disabled',
    'offline',
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
            <div className="flex items-center gap-4 rounded-md bg-sidebar p-3">
                {STATES.map((state) => (
                    <span key={state} className="flex items-center gap-2">
                        <span className="relative shrink-0">
                            <Avatar userId={4}>
                                <AvatarFallback className="text-xs font-medium">
                                    EM
                                </AvatarFallback>
                            </Avatar>
                            <ConnectionDot state={state} />
                        </span>
                        <span className="text-muted-foreground">{state}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
