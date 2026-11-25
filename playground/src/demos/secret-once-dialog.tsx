import { useState } from 'react';
import { SecretOnceDialog } from '@/components/secrets/secret-once-dialog';
import { Button } from '@/components/ui/button';

/** Plainly not a real secret, so secret scanners do not flag it: the playground has no server. */
const DEMO_SECRET = 'DEMO-not-a-real-secret';

export default function SecretOnceDialogDemo() {
    const [secret, setSecret] = useState<string | null>(null);

    return (
        <>
            <Button onClick={() => setSecret(DEMO_SECRET)}>
                Generate signing secret
            </Button>
            <SecretOnceDialog
                secret={secret}
                title="Copy the signing secret for the alert webhook"
                announcement="Signing secret generated. It is shown only once."
                onAcknowledge={() => setSecret(null)}
            />
        </>
    );
}
