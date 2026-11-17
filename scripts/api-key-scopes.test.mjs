import assert from 'node:assert/strict';
import { test } from 'node:test';
// Node strips the types of the registry's TypeScript lib (no imports in it).
import {
    apiKeyAccessLevel,
    apiKeyStatus,
    isApiKeyScope,
    withApiKeyAccessLevel,
} from '../registry/src/lib/api-key-scopes.ts';

test('only <resource>:(read|write) is a scope', () => {
    for (const scope of ['mcp:read', 'brain:write', 'audit-logs:read']) {
        assert.equal(isApiKeyScope(scope), true, scope);
    }

    for (const scope of [
        'read_only',
        'mcp:*',
        'mcp:delete',
        'Mcp:read',
        '1mcp:read',
        'mcp:read ',
        'collections:posts:read',
        ':read',
    ]) {
        assert.equal(isApiKeyScope(scope), false, scope);
    }
});

test('write wins over read, because write implies read', () => {
    assert.equal(
        apiKeyAccessLevel(['posts:read', 'posts:write'], 'posts'),
        'write',
    );
    assert.equal(apiKeyAccessLevel(['posts:read'], 'posts'), 'read');
    assert.equal(apiKeyAccessLevel(['pages:write'], 'posts'), 'none');
});

test('a resource name is not matched as a prefix of another', () => {
    assert.equal(apiKeyAccessLevel(['posts-archive:write'], 'posts'), 'none');
    assert.deepEqual(
        withApiKeyAccessLevel(['posts-archive:write'], 'posts', 'read'),
        ['posts-archive:write', 'posts:read'],
    );
});

test('setting a level keeps one scope per resource and leaves the others alone', () => {
    const scopes = ['mcp:read', 'posts:read', 'posts:write', 'users:read'];

    assert.deepEqual(withApiKeyAccessLevel(scopes, 'posts', 'read'), [
        'mcp:read',
        'users:read',
        'posts:read',
    ]);
    assert.deepEqual(withApiKeyAccessLevel(scopes, 'posts', 'none'), [
        'mcp:read',
        'users:read',
    ]);
    assert.deepEqual(scopes, [
        'mcp:read',
        'posts:read',
        'posts:write',
        'users:read',
    ]);
});

test('revoked wins over expired, and expiry is reached at the instant itself', () => {
    const now = new Date('2026-11-17T12:00:00Z');

    assert.equal(
        apiKeyStatus(
            {
                revoked_at: '2026-11-01T00:00:00Z',
                expires_at: '2026-11-02T00:00:00Z',
            },
            now,
        ),
        'revoked',
    );
    assert.equal(
        apiKeyStatus(
            { revoked_at: null, expires_at: '2026-11-17T12:00:00Z' },
            now,
        ),
        'expired',
    );
    assert.equal(
        apiKeyStatus(
            { revoked_at: null, expires_at: '2026-11-17T12:00:01Z' },
            now,
        ),
        'active',
    );
    assert.equal(
        apiKeyStatus({ revoked_at: null, expires_at: null }, now),
        'active',
    );
});
