import { useState } from 'react';
import { ApiKeyForm } from '@/components/api-keys/api-key-form';
import type { ApiKeyFormValues } from '@/components/api-keys/api-key-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const EMPTY_VALUES: ApiKeyFormValues = {
    name: '',
    scopes: [],
    expires_at: '',
    ip_allowlist: '',
    rate_limit_per_minute: '',
};

/** The form in the create dialog of docs/api-keys.md; the server's errors are faked on submit. */
export default function ApiKeyFormDemo() {
    const [isOpen, setIsOpen] = useState(false);
    const [values, setValues] = useState(EMPTY_VALUES);
    const [errors, setErrors] = useState<
        Partial<Record<keyof ApiKeyFormValues, string>>
    >({});

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Button onClick={() => setIsOpen(true)}>Create API key</Button>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create API key</DialogTitle>
                    <DialogDescription>
                        The key acts with your permissions, narrowed to the ones
                        you pick.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <ApiKeyForm
                        id="api-key-create-form"
                        values={values}
                        errors={errors}
                        resources={[
                            { resource: 'posts', label: 'Posts' },
                            { resource: 'files', label: 'Files' },
                            { resource: 'mcp', label: 'MCP' },
                        ]}
                        onFieldChange={(field, value) =>
                            setValues((current) => ({
                                ...current,
                                [field]: value,
                            }))
                        }
                        onSubmit={() =>
                            setErrors({
                                name:
                                    values.name === ''
                                        ? 'The name field is required.'
                                        : undefined,
                                scopes:
                                    values.scopes.length === 0
                                        ? 'Pick at least one permission.'
                                        : undefined,
                            })
                        }
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="api-key-create-form">
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
