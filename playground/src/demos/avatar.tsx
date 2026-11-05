import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const PEOPLE = ['EM', 'LB', 'GR', 'AT', 'SF', 'MC', 'PV', 'DN', 'RC', 'FZ'];

/** Each `userId` maps to one of the ten theme swatches; no id falls back to muted. */
export default function AvatarDemo() {
    return (
        <div className="flex flex-wrap gap-2">
            {PEOPLE.map((initials, index) => (
                <Avatar key={initials} userId={index + 1}>
                    <AvatarFallback className="text-xs font-medium">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            ))}
            <Avatar>
                <AvatarFallback className="text-xs font-medium">
                    ?
                </AvatarFallback>
            </Avatar>
        </div>
    );
}
