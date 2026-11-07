import { useState } from 'react';
import { RemovableBadge } from '@/components/removable-badge';

export default function RemovableBadgeDemo() {
    const [tags, setTags] = useState(['invoice', 'q4', 'archive']);

    return (
        <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
                <RemovableBadge
                    key={tag}
                    removeLabel={`Remove tag ${tag}`}
                    onRemove={() =>
                        setTags((current) =>
                            current.filter((other) => other !== tag),
                        )
                    }
                >
                    {tag}
                </RemovableBadge>
            ))}
            <RemovableBadge removeLabel="Remove tag locked">
                locked
            </RemovableBadge>
        </div>
    );
}
