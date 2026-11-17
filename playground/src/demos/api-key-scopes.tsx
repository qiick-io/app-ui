import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    apiKeyAccessLevel,
    isApiKeyScope,
    withApiKeyAccessLevel,
} from '@/lib/api-key-scopes';

/** One scope per resource, write implies read; strings outside the vocabulary are refused. */
export default function ApiKeyScopesDemo() {
    const [scopes, setScopes] = useState<string[]>(['mcp:read']);
    const level = apiKeyAccessLevel(scopes, 'posts');

    return (
        <div className="flex flex-col gap-2 text-sm">
            <div className="flex gap-2">
                {(['none', 'read', 'write'] as const).map((nextLevel) => (
                    <Button
                        key={nextLevel}
                        variant={level === nextLevel ? 'default' : 'outline'}
                        onClick={() =>
                            setScopes(
                                withApiKeyAccessLevel(
                                    scopes,
                                    'posts',
                                    nextLevel,
                                ),
                            )
                        }
                    >
                        posts: {nextLevel}
                    </Button>
                ))}
            </div>
            <code className="font-mono text-xs">{JSON.stringify(scopes)}</code>
            <p className="text-muted-foreground">
                read_only is a scope: {String(isApiKeyScope('read_only'))}
            </p>
        </div>
    );
}
