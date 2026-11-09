import { Button } from '@/components/ui/button';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';

/** Preview card on hover or focus. */
export default function HoverCardDemo() {
    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <Button variant="link">@elena</Button>
            </HoverCardTrigger>
            <HoverCardContent className="text-sm">
                Elena Marchetti · Editor · last seen 2 minutes ago
            </HoverCardContent>
        </HoverCard>
    );
}
