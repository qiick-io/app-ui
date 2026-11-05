import { useState } from 'react';
import { FilesGridBody } from '../screens/files-grid-body';

/** Scroll the panel: the next page loads 400px before the end. Full page: `#/files`. */
export default function FilesGridDemo() {
    const [isEmpty, setIsEmpty] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    return (
        <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={isEmpty}
                    onChange={(event) => setIsEmpty(event.target.checked)}
                />
                Empty folder
            </label>
            <div className="flex h-96 flex-col overflow-auto rounded-md border p-3">
                <FilesGridBody
                    isEmpty={isEmpty}
                    selectedIds={selectedIds}
                    onSelectedIdsChange={setSelectedIds}
                />
            </div>
        </div>
    );
}
