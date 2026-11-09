import { Loader2 } from 'lucide-react';
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker';

/** Status lines in a conversation. */
export default function MarkerDemo() {
    return (
        <div className="flex flex-col gap-2">
            <Marker role="status">
                <MarkerIcon>
                    <Loader2 className="animate-spin" />
                </MarkerIcon>
                <MarkerContent>
                    Searching the Articles collection…
                </MarkerContent>
            </Marker>
            <Marker>
                <MarkerContent>Today</MarkerContent>
            </Marker>
        </div>
    );
}
