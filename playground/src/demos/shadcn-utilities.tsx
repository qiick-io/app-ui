/** The shadcn utilities: a scroll container whose bottom edge fades (`scroll-fade-b`). */
export default function ShadcnUtilitiesDemo() {
    return (
        <div className="h-32 w-56 scroll-fade-b overflow-y-auto rounded-md border p-3 text-sm">
            {Array.from({ length: 12 }, (_, index) => (
                <p key={index}>Line {index + 1}</p>
            ))}
        </div>
    );
}
