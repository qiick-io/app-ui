import { Copy, Search } from 'lucide-react';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
} from '@/components/ui/input-group';

export default function InputGroupDemo() {
    return (
        <div className="grid max-w-sm gap-2">
            <InputGroup>
                <InputGroupAddon>
                    <Search />
                </InputGroupAddon>
                <InputGroupInput placeholder="Search…" aria-label="Search" />
            </InputGroup>
            <InputGroup>
                <InputGroupAddon>
                    <InputGroupText>https://</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput defaultValue="qiick.io" aria-label="URL" />
                <InputGroupAddon align="inline-end">
                    <InputGroupButton size="icon-xs" aria-label="Copy">
                        <Copy />
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </div>
    );
}
