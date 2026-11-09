import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function DialogDemo() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Rename</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename file</DialogTitle>
                    <DialogDescription>
                        The new name is visible to everyone.
                    </DialogDescription>
                </DialogHeader>
                <Input defaultValue="report.pdf" aria-label="File name" />
                <DialogFooter>
                    <Button>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
