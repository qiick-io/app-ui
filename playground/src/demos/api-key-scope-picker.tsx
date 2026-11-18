import { useState } from 'react';
import { ApiKeyScopePicker } from '@/components/api-keys/api-key-scope-picker';

export default function ApiKeyScopePickerDemo() {
    const [scopes, setScopes] = useState<string[]>(['posts:write']);

    return (
        <div className="max-w-xl">
            <ApiKeyScopePicker
                resources={[
                    {
                        resource: 'posts',
                        label: 'Posts',
                        description: 'Collection items and their revisions',
                    },
                    { resource: 'files', label: 'Files' },
                    {
                        resource: 'users',
                        label: 'Users',
                        description: 'Read only: users are managed in the app',
                        availableActions: ['read'],
                    },
                    {
                        resource: 'mcp',
                        label: 'MCP',
                        description: 'Tools for AI agents',
                    },
                ]}
                value={scopes}
                onChange={setScopes}
            />
        </div>
    );
}
