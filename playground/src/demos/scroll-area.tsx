import { ScrollArea } from '@/components/ui/scroll-area';

/** Scroll container with styled scrollbars. */
export default function ScrollAreaDemo() {
    return (
        <ScrollArea className="h-40 w-56 rounded-md border">
            <ul className="p-3 text-sm">
                {Array.from({ length: 20 }, (_, index) => (
                    <li key={index} className="py-1">
                        Folder {index + 1}
                    </li>
                ))}
            </ul>
        </ScrollArea>
    );
}
