import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const PEOPLE = ['Elena Marchetti', 'Ines Moreau', 'Luca Rossi', 'Noah Weber'];

/** Popover + Command: the picker pattern (relations, users, tags, mentions). */
export default function CommandDemo() {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>(['Ines Moreau']);

    const toggle = (name: string): void =>
        setSelected((current) =>
            current.includes(name)
                ? current.filter((value) => value !== name)
                : [...current, name],
        );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-64 justify-between"
                >
                    {selected.length > 0
                        ? `${selected.length} selected`
                        : 'Pick people'}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0">
                <Command>
                    <CommandInput placeholder="Search people…" />
                    <CommandList>
                        <CommandEmpty>No people found.</CommandEmpty>
                        <CommandGroup>
                            {PEOPLE.map((name) => (
                                <CommandItem
                                    key={name}
                                    value={name}
                                    onSelect={() => toggle(name)}
                                >
                                    <Check
                                        className={cn(
                                            selected.includes(name)
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    {name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
