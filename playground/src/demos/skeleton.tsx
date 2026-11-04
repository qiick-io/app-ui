import { Skeleton } from '@/components/ui/skeleton';

export default function SkeletonDemo() {
    return (
        <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="grid gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
    );
}
