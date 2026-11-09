import { Button } from '@/components/ui/button';
import { UserHoverCard } from '@/components/user-hover-card';

export default function UserHoverCardDemo() {
    return (
        <p className="text-sm">
            Reviewed by{' '}
            <UserHoverCard
                user={{ id: 2, name: 'Giulia Ferri', role: 'Editor' }}
                isOnline
            >
                <Button variant="link" className="h-auto p-0">
                    Giulia Ferri
                </Button>
            </UserHoverCard>{' '}
            and{' '}
            <UserHoverCard
                user={{ id: 3, name: 'Carolina Bogan', role: 'Author' }}
                isOnline={false}
            >
                <Button variant="link" className="h-auto p-0">
                    Carolina Bogan
                </Button>
            </UserHoverCard>
            .
        </p>
    );
}
