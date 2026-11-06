import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from '@/components/ui/popover';

/** Popover with a header. */
export default function PopoverDemo() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">Preview as of…</Button>
            </PopoverTrigger>
            <PopoverContent>
                <PopoverHeader>
                    <PopoverTitle>Preview as of</PopoverTitle>
                    <PopoverDescription>
                        Open the item as it was or will be at a date.
                    </PopoverDescription>
                </PopoverHeader>
            </PopoverContent>
        </Popover>
    );
}
