import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function SwitchDemo() {
    return (
        <div className="flex items-center gap-2">
            <Switch id="demo-switch" defaultChecked />
            <Label htmlFor="demo-switch">Notification sounds</Label>
        </div>
    );
}
