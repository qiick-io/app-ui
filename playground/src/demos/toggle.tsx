import { Bold, Italic } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

export default function ToggleDemo() {
    return (
        <div className="flex gap-2">
            <Toggle aria-label="Bold" defaultPressed>
                <Bold />
            </Toggle>
            <Toggle variant="outline" aria-label="Italic">
                <Italic />
                Italic
            </Toggle>
            <Toggle size="sm" variant="outline" aria-label="Bold small">
                <Bold />
            </Toggle>
        </div>
    );
}
