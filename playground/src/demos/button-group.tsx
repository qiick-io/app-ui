import { ChevronDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    ButtonGroup,
    ButtonGroupSeparator,
} from '@/components/ui/button-group';

/** Split button: the primary action plus a menu trigger. */
export default function ButtonGroupDemo() {
    return (
        <ButtonGroup>
            <Button>
                <Save />
                Save
            </Button>
            <ButtonGroupSeparator />
            <Button size="icon" aria-label="More save options">
                <ChevronDown />
            </Button>
        </ButtonGroup>
    );
}
