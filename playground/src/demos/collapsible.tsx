import { ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function CollapsibleDemo() {
    return (
        <Collapsible className="flex w-72 flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">3 revisions</span>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Toggle">
                        <ChevronsUpDown />
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span>Published by Giulia Ferri</span>
                <span>Edited by Lars Holm</span>
                <span>Created by Lars Holm</span>
            </CollapsibleContent>
        </Collapsible>
    );
}
