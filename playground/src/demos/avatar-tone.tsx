import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { avatarToneClass } from '@/lib/avatar-tone';

const PEOPLE = ['EM', 'LB', 'GR', 'AT', 'SF', 'MC', 'PV', 'DN', 'RC', 'FZ'];

/** `avatarToneClass(id)` on AvatarFallback: one of the ten theme swatches per user. */
export default function AvatarToneDemo() {
    return (
        <div className="flex flex-wrap gap-2">
            {PEOPLE.map((initials, index) => (
                <Avatar key={initials}>
                    <AvatarFallback className={avatarToneClass(index + 1)}>
                        {initials}
                    </AvatarFallback>
                </Avatar>
            ))}
        </div>
    );
}
