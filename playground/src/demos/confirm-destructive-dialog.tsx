import { useState } from 'react';
import { ConfirmDestructiveDialog } from '@/components/confirm-destructive-dialog';
import { Button } from '@/components/ui/button';

export default function ConfirmDestructiveDialogDemo() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button variant="destructive" onClick={() => setIsOpen(true)}>
                Delete project
            </Button>
            <ConfirmDestructiveDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                title="Delete project?"
                description="Every collection and file is deleted. This cannot be undone."
                typedConfirmation="externa"
                onConfirm={() => setIsOpen(false)}
            />
        </>
    );
}
