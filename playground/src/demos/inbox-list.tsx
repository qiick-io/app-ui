import { CheckCheck, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { InboxDetailSheet, InboxSavedViews } from '@/components/inbox-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const VIEWS = [
    { id: 'unresolved', label: 'Unresolved', href: '#', count: 14 },
    { id: 'mine', label: 'Assigned to me', href: '#', count: 3 },
    { id: 'new', label: 'New in 24h', href: '#', count: 5 },
];

/** Saved views, and one item opened in the detail sheet. */
export default function InboxListDemo() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="grid gap-3 text-sm">
            <InboxSavedViews views={VIEWS} activeViewId="unresolved" />
            <Button
                variant="outline"
                className="w-fit"
                onClick={() => setIsOpen(true)}
            >
                Open "TypeError in CheckoutController"
            </Button>
            <InboxDetailSheet
                open={isOpen}
                onOpenChange={setIsOpen}
                title="TypeError in CheckoutController"
                description="Exception · 412 events · first seen 3 days ago · last seen 2 min ago"
                status={
                    <>
                        <Badge variant="destructive">Critical</Badge>
                        <Badge variant="outline">Unresolved</Badge>
                    </>
                }
                actions={
                    <>
                        <Button variant="outline">
                            <UserPlus aria-hidden="true" />
                            Assign
                        </Button>
                        <Button>
                            <CheckCheck aria-hidden="true" />
                            Resolve
                        </Button>
                    </>
                }
                nextStep={
                    <p className="text-muted-foreground">
                        Null cart on guest checkout: guard{' '}
                        <code>$cart-&gt;total()</code> in
                        <code> CheckoutController@store</code>.
                    </p>
                }
                sections={[
                    {
                        id: 'trace',
                        title: 'Stack trace',
                        defaultOpen: true,
                        content: (
                            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                                app/Http/Controllers/CheckoutController.php:42
                            </pre>
                        ),
                    },
                    {
                        id: 'context',
                        title: 'Context',
                        content: <p>PHP 8.4 · Laravel 13</p>,
                    },
                    {
                        id: 'history',
                        title: 'History',
                        content: <p>Assigned to Ada Lovelace</p>,
                    },
                ]}
                fullPageHref="#"
            />
        </div>
    );
}
