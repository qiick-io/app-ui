import { Input } from '@/components/ui/input';

export default function InputDemo() {
    return (
        <div className="grid max-w-sm gap-2">
            <Input placeholder="Email" aria-label="Email" />
            <Input placeholder="Invalid" aria-label="Invalid" aria-invalid />
            <Input placeholder="Disabled" aria-label="Disabled" disabled />
        </div>
    );
}
