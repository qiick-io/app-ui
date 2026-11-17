import { useState } from 'react';
import { ApiKeySecretDialog } from '@/components/api-keys/api-key-secret-dialog';
import { Button } from '@/components/ui/button';

/** Not a real key: the playground has no server. */
const DEMO_SECRET = 'demo_7fK2pQ9xLm4vT8nR1sW6yZ3bC5dH0jE2gA9uV7kP';

export default function ApiKeySecretDialogDemo() {
    const [secret, setSecret] = useState<string | null>(null);

    return (
        <>
            <Button onClick={() => setSecret(DEMO_SECRET)}>Create key</Button>
            <ApiKeySecretDialog
                secret={secret}
                keyName="Zapier sync"
                onAcknowledge={() => setSecret(null)}
            />
        </>
    );
}
