import { CircleCheckIcon, SearchIcon } from 'lucide-react';
import {
    Trace,
    TraceCollapsible,
    TraceCollapsibleContent,
    TraceCollapsibleTrigger,
    TraceDescription,
    TraceIcon,
    TraceLine,
    TraceTitle,
} from '@/components/ui/trace';

export default function TraceDemo() {
    return (
        <Trace className="max-w-md">
            <TraceLine>
                <TraceIcon>
                    <CircleCheckIcon />
                </TraceIcon>
                <TraceTitle>Read the settings</TraceTitle>
                <TraceDescription>2s</TraceDescription>
            </TraceLine>
            <TraceLine status="running">
                <TraceIcon>
                    <SearchIcon />
                </TraceIcon>
                <TraceTitle>Searching the items</TraceTitle>
            </TraceLine>
            <TraceCollapsible>
                <TraceCollapsibleTrigger>
                    <TraceLine status="error">
                        <TraceTitle>Could not export the collection</TraceTitle>
                    </TraceLine>
                </TraceCollapsibleTrigger>
                <TraceCollapsibleContent>
                    The export is larger than 100 MB.
                </TraceCollapsibleContent>
            </TraceCollapsible>
        </Trace>
    );
}
