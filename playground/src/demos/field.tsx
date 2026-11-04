import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export default function FieldDemo() {
    return (
        <FieldGroup className="max-w-sm">
            <Field>
                <FieldLabel htmlFor="demo-name">Project name</FieldLabel>
                <Input id="demo-name" defaultValue="Externa" />
                <FieldDescription>Shown in the sidebar.</FieldDescription>
            </Field>
            <Field data-invalid>
                <FieldLabel htmlFor="demo-url">Site URL</FieldLabel>
                <Input id="demo-url" defaultValue="qiick" aria-invalid />
                <FieldError>Enter a valid URL.</FieldError>
            </Field>
        </FieldGroup>
    );
}
