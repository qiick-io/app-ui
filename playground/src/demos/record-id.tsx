import type { RecordId } from '@/lib/record-id';

const RECORD_IDS: RecordId[] = ['f47ac10b-58cc-4372-a567-0e02b2c3d479', 7];

/** `RecordId` accepts an API UUID or a legacy numeric id, with no coercion. */
export default function RecordIdDemo() {
    return (
        <ul className="flex flex-col gap-1 text-sm">
            {RECORD_IDS.map((recordId) => (
                <li key={recordId}>
                    {typeof recordId}: {String(recordId)}
                </li>
            ))}
        </ul>
    );
}
