import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function CheckboxDemo() {
    return (
        <div className="flex gap-4">
            <div className="flex items-center gap-2">
                <Checkbox id="demo-checked" defaultChecked />
                <Label htmlFor="demo-checked">Checked</Label>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox id="demo-unchecked" />
                <Label htmlFor="demo-unchecked">Unchecked</Label>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox id="demo-disabled" disabled />
                <Label htmlFor="demo-disabled">Disabled</Label>
            </div>
        </div>
    );
}
