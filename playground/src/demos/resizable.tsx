import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';

/** Split view: a list beside a detail panel, resized with the handle. */
export default function ResizableDemo() {
    return (
        // The panel group sizes itself to its parent (inline 100% height).
        <div className="h-48 w-full max-w-xl rounded-lg border">
            <ResizablePanelGroup orientation="horizontal">
                <ResizablePanel defaultSize="35%" minSize="20%">
                    <div className="flex h-full items-center justify-center p-4 text-sm">
                        List
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize="65%">
                    <div className="flex h-full items-center justify-center p-4 text-sm">
                        Detail
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
