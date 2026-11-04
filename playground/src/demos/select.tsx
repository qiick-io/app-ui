import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function SelectDemo() {
    return (
        <Select defaultValue="created_at">
            <SelectTrigger aria-label="Sort by" className="w-[7.5rem]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="created_at">Created</SelectItem>
                <SelectItem value="updated_at">Updated</SelectItem>
                <SelectItem value="email">Email</SelectItem>
            </SelectContent>
        </Select>
    );
}
