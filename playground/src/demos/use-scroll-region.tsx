import { useScrollRegion } from '@/hooks/use-scroll-region';

/** A list that overflows its box: Tab focuses it, the arrow keys scroll it. */
export default function UseScrollRegionDemo() {
    const [setScrollRegion, scrollRegionTabIndex] =
        useScrollRegion<HTMLDivElement>();

    return (
        <div
            ref={setScrollRegion}
            tabIndex={scrollRegionTabIndex}
            role="region"
            aria-label="Folders"
            className="h-40 w-56 overflow-auto rounded-md border outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <ul className="p-3 text-sm">
                {Array.from({ length: 20 }, (_, index) => (
                    <li key={index} className="py-1">
                        Folder {index + 1}
                    </li>
                ))}
            </ul>
        </div>
    );
}
