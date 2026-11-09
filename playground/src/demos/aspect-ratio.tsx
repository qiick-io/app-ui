import { AspectRatio } from '@/components/ui/aspect-ratio';

/** Fixed aspect ratio box for media. */
export default function AspectRatioDemo() {
    return (
        <div className="w-64">
            <AspectRatio ratio={16 / 9} className="rounded-md bg-muted">
                <span className="flex size-full items-center justify-center text-sm text-muted-foreground">
                    16 / 9
                </span>
            </AspectRatio>
        </div>
    );
}
