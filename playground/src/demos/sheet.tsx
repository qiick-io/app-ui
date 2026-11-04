import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';

export default function SheetDemo() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">New user</Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>New user</SheetTitle>
                    <SheetDescription>
                        The user gets an email to set a password.
                    </SheetDescription>
                </SheetHeader>
                <SheetFooter>
                    <Button>Create</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
