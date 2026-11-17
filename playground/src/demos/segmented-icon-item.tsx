import { History, Palette } from 'lucide-react';
import { useState } from 'react';
import { SegmentedIconItem } from '@/components/admin/segmented-icon-item';
import { ToggleGroup } from '@/components/ui/toggle-group';

export default function SegmentedIconItemDemo() {
    const [colourBy, setColourBy] = useState('area');

    return (
        <ToggleGroup
            variant="outline"
            type="single"
            value={colourBy}
            aria-label="Colour by"
            onValueChange={(value) => value && setColourBy(value)}
        >
            <SegmentedIconItem
                value="area"
                label="Colour by area"
                isActive={colourBy === 'area'}
            >
                <Palette />
            </SegmentedIconItem>
            <SegmentedIconItem
                value="freshness"
                label="Colour by last change"
                isActive={colourBy === 'freshness'}
            >
                <History />
            </SegmentedIconItem>
        </ToggleGroup>
    );
}
