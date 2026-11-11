import { UserPlus, Users } from 'lucide-react';
import { PageEmptyState } from '@/components/admin/page-empty-state';
import { Button } from '@/components/ui/button';

export default function PageEmptyStateDemo() {
    return (
        <PageEmptyState
            icon={Users}
            title="No users yet"
            description="Invite the people who manage this project."
            action={
                <Button>
                    <UserPlus className="size-4" />
                    New user
                </Button>
            }
            docsHref="https://docs.qiick.io/externa"
            docsLabel="Documentation"
        />
    );
}
