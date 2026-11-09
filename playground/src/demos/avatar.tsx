import {
    Avatar,
    AvatarBadge,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
} from '@/components/ui/avatar';

const PEOPLE = ['EM', 'LB', 'GR', 'AT'];

/** The shadcn avatar: muted initials, sizes, a status badge and a group with a count. */
export default function AvatarDemo() {
    return (
        <div className="flex flex-wrap items-center gap-6">
            <Avatar size="sm">
                <AvatarFallback>EM</AvatarFallback>
            </Avatar>
            <Avatar>
                <AvatarFallback>EM</AvatarFallback>
                <AvatarBadge />
            </Avatar>
            <Avatar size="lg">
                <AvatarFallback>EM</AvatarFallback>
            </Avatar>
            <AvatarGroup>
                {PEOPLE.map((initials) => (
                    <Avatar key={initials}>
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                ))}
                <AvatarGroupCount>+3</AvatarGroupCount>
            </AvatarGroup>
        </div>
    );
}
