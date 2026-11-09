import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function RadioGroupDemo() {
    return (
        <RadioGroup defaultValue="system" aria-label="Appearance">
            {['light', 'dark', 'system'].map((value) => (
                <div key={value} className="flex items-center gap-2">
                    <RadioGroupItem value={value} id={`demo-radio-${value}`} />
                    <Label htmlFor={`demo-radio-${value}`}>{value}</Label>
                </div>
            ))}
        </RadioGroup>
    );
}
