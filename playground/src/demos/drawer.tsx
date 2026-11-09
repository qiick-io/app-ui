import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerBody,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';

export default function DrawerDemo() {
    return (
        <Drawer direction="right">
            <DrawerTrigger asChild>
                <Button variant="outline">Open drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>File details</DrawerTitle>
                    <DrawerDescription>report-q3.pdf</DrawerDescription>
                </DrawerHeader>
                <DrawerBody className="text-sm">
                    The body scrolls between a fixed header and footer.
                </DrawerBody>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
