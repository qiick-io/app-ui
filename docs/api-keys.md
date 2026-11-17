# API keys

**Registry:** `api-key-form`, `api-key-scope-picker`, `api-key-secret-dialog`, `api-key-list-row`, `api-key-scopes`; around them `data-table`, `dialog`, `confirm-destructive-dialog`, `page-empty-state`.

**Copy from externa-core:** the page around the items (header action, settings layout, empty state) `pages/admin/api-keys/index.tsx`; the API conventions in [api.md](api.md).

The API key screen is the most security-sensitive screen a qiick product ships, and in an AI-first product it is the door agents come through: what a key may do is what an agent may do. Every product implements the same baseline, so a key means the same thing everywhere and an agent holding one can reason about it the same way in every product.

## Storage

One `api_keys` table with these columns, named exactly like this:

| Column                     | Type                         | Note                                                                       |
| -------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| `uuid`                     | uuid                         | `ulid` where the app uses ulids, declared as a divergence                  |
| `name`                     | string                       | what uses the key, so it can be found when it has to be rotated or revoked |
| `key_prefix`               | string, indexed              | the lookup half of the token, shown in the list                            |
| `key_hash`                 | string                       | SHA-256 of the secret half; the secret is never stored                     |
| `owner_id`                 | fk users                     | the identity the key acts as                                               |
| `created_by`               | fk users                     | who issued it, kept apart from the owner on purpose                        |
| `scopes`                   | json                         | `<resource>:<action>` strings, see below                                   |
| `ip_allowlist`             | json, nullable               | addresses and CIDR ranges; null allows every address                       |
| `rate_limit_per_minute`    | unsigned int, nullable       | null falls back to the `api` rate limiter                                  |
| `expires_at`               | timestamp, nullable          | null never expires                                                         |
| `last_used_at`             | timestamp, nullable          |                                                                            |
| `revoked_at`               | timestamp, nullable, indexed |                                                                            |
| `previous_key_hash`        | string, nullable             | the secret replaced by the last rotation, valid until the next column      |
| `previous_key_valid_until` | timestamp, nullable          | end of the rotation grace window                                           |

- The token is `<key_prefix>_<secret>`. The server looks the row up by `key_prefix` and compares the SHA-256 of the secret with `hash_equals()`, against `key_hash` and, while `previous_key_valid_until` is in the future, `previous_key_hash`.
- A key never grants more than its owner can do: every request is checked against the owner's permissions **and** the key's scopes. Deactivating the owner stops their keys.
- Column names are part of the baseline. A product that needs more (a tenancy column, a separately displayed prefix) **adds** a column; it never renames `key_prefix` / `key_hash` or replaces `scopes`.

## Permission vocabulary

A scope is a resource and an action, nothing else:

```
^[a-z][a-z0-9-]*:(read|write)$
```

- The resource is a product noun in kebab-case (`posts`, `audit-logs`, `users`); `mcp` gates the MCP surface ([ai-backend.md](ai-backend.md)).
- **`write` implies `read`** on the same resource. A key stores one scope per resource, the highest it holds (`posts:write`, never `posts:read` next to it); the server checks `read` as "`read` or `write`".
- No `read_only` boolean, no `canWrite` flag, no per-feature enum (`files_scope: none | read | all`) carrying permission meaning: each of those is a resource with `read` or `write`.
- The product lists its resources once, as a string-backed `ApiKeyScopeEnum` whose values are the scopes; `StoreApiKeyRequest` accepts only those values (`Rule::enum`) and nothing outside the pattern reaches the database.
- A product that needs a third action proposes it in app-ui first, as a change to this page, before using it.

## Behaviour

1. **The secret is shown once.** The create and rotate responses carry the plain-text key once (`flash.plain_text_api_key`), and the screen shows it in `ApiKeySecretDialog`. It is never stored, logged, put in the activity log or sent again; a lost key is rotated, not retrieved.
2. **Rotation** issues a new secret for the same key: same row, `uuid`, `key_prefix`, scopes and audit trail. The old hash moves to `previous_key_hash` and keeps working until `previous_key_valid_until` (`config('api.key_rotation_grace_hours')`, 24 by default), so an integration can switch without downtime. Without rotation, the only answer to a leak is to break the integration.
3. **Revocation is immediate** and keeps the row: `revoked_at` is set, `previous_key_hash` is cleared (a revoked key has no grace window), and the key stays in the list and the audit trail. Keys are never deleted from the screen.
4. **Every create, rotate and revoke is in the activity log**, `activity('api-keys')->causedBy($actor)->performedOn($apiKey)`, with the events `created`, `rotated`, `revoked` and the name and scopes as properties. The model's own logging excludes `key_hash` and `previous_key_hash` ([logging-and-audit.md](logging-and-audit.md)).
5. **Expiry is notified** to the owner (and to the issuer when it is someone else) seven days before `expires_at`, as a database notification (the bell, [notifications.md](notifications.md)) and a mail. A daily scheduled command picks the keys that expire between seven and eight days from now, so each key is notified once without extra state.
6. **`last_used_at` is recorded** by the authenticating middleware, at most once a minute per key (it skips the write while `last_used_at` is less than a minute old), so a busy integration does not write on every request.
7. **Expired and revoked keys fail closed**, with the same response in every product: `401`, `WWW-Authenticate: Bearer error="invalid_token"` and `{"message": "…", "error": "invalid_token"}`, the message saying whether the key is unknown, expired or revoked. A missing scope is `403` with `"error": "insufficient_scope"` and the scope it needed; an address outside `ip_allowlist` is `403`; the rate limit is `429` ([api.md](api.md)).

### Server side

Like every write ([`standards/rules/backend.md`](../standards/rules/backend.md)): `StoreApiKeyRequest` → `ApiKeyData` → `CreateApiKeyAction`; `RotateApiKeyAction` and `RevokeApiKeyAction` for the two row actions; `ApiKeyPolicy` decides who may manage which keys; `AuthenticateApiKeyMiddleware` does the lookup, the checks of behaviour 7 and `last_used_at`. The REST API and the MCP server authenticate through the same middleware. Tests prove: the secret is not in the database, the activity log or a second response; an expired, a revoked and an unknown key get the same `401` shape; the previous secret works inside the grace window and not after it; `write` satisfies a `read` check and `read` does not satisfy `write`.

## Screen

**Where** the screen lives follows the product's information architecture: `admin/api-keys` where keys are instance administration, `settings/api-keys` where they belong to a user or workspace. What does not vary is that the **route and the page agree**: `settings/api-keys` renders `pages/settings/api-keys.tsx`, never a page filed under another area.

The items are separate so they fit either place:

| Item                    | What it is                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `api-key-form`          | `ApiKeyForm`: name, permissions, then the optional restrictions (expiry, IP allowlist, rate limit). The `<form>` only. |
| `api-key-scope-picker`  | `ApiKeyScopePicker`: a row per resource with No access / Read / Write. It can only produce the vocabulary above.       |
| `api-key-secret-dialog` | `ApiKeySecretDialog`: the show-once secret after create and rotate.                                                    |
| `api-key-list-row`      | `useApiKeyColumns()` for `DataTable`, `ApiKeyStatusBadge`, `ApiKeyRowActions` (rotate, revoke), `ApiKeyRevokeDialog`.  |
| `api-key-scopes`        | `lib/api-key-scopes.ts`: the pattern, `apiKeyAccessLevel()`, `withApiKeyAccessLevel()`, `apiKeyStatus()`.              |

### Composition

- **Page:** the list page in the settings or admin layout ([list-page.md](list-page.md), [settings.md](settings.md)). **Create API key** (`KeyRound` icon) is the primary action, far right in `headerActions`. No keys yet: `PageEmptyState` with the same action.
- **List:** `DataTable` with `useApiKeyColumns()`: name, key prefix (`qk_7fK2pQ9x…`, monospace), permissions, last used ("Never used"), expires ("Never"), status (`success` Active, `warning` Expired, `muted` Revoked), row actions last. Rotate shows on active keys only; a revoked key has no actions.
- **Create:** a `Dialog` ([forms.md](forms.md): a one-shot result) holding `ApiKeyForm`, Cancel then **Create** bottom right, the submit button outside the form through `form={id}`. On success the dialog closes and `ApiKeySecretDialog` opens with the secret.
- **Rotate:** the row action posts straight away, without a confirmation: nothing breaks, because the old secret keeps working for the grace window. The secret dialog opens with `reason="rotated"` and `previousSecretValidUntil`.
- **Revoke:** `ApiKeyRevokeDialog` ([destructive-actions.md](destructive-actions.md)): Cancel / Revoke, no typed confirmation, since the row stays.
- **Product fields** (an owner picker, a tenancy, a collection list) go in `ApiKeyForm`'s `children`, after the name, and their columns are spliced into the array `useApiKeyColumns()` returns. They are declared divergences (below), not changes to the items.

```tsx
const form = useForm<ApiKeyFormValues>({
    name: '',
    scopes: [],
    expires_at: '',
    ip_allowlist: '',
    rate_limit_per_minute: '',
});
const columns = useApiKeyColumns<ApiKeyRow>({
    onRotate: rotateKey,
    onRevoke: setPendingRevokeKey,
});

<DialogContent className="sm:max-w-2xl">
    <DialogHeader>…</DialogHeader>
    <ApiKeyForm
        id="api-key-create-form"
        values={form.data}
        onFieldChange={form.setData}
        errors={form.errors}
        resources={API_KEY_RESOURCES}
        isProcessing={form.processing}
        onSubmit={submit}
    />
    <DialogFooter>
        <Button variant="outline" onClick={closeCreateDialog}>…</Button>
        <Button type="submit" form="api-key-create-form" disabled={form.processing}>…</Button>
    </DialogFooter>
</DialogContent>

<ApiKeySecretDialog
    secret={flash.plain_text_api_key ?? null}
    keyName={issuedKeyName}
    onAcknowledge={forgetSecret}
/>
```

### The secret dialog

The one screen where a mistake cannot be undone, so `ApiKeySecretDialog` is strict:

- An `AlertDialog`: Esc and the overlay do not close it. **Done** stays disabled until the user ticks "I have stored the key somewhere safe".
- The secret is in a read-only monospace field that takes focus when the dialog opens and selects its text, so it can be copied with the keyboard as well as with **Copy**; the opening and the copy result are announced in the live region. If the clipboard is unavailable, the text stays selected and the failure is announced.
- The app drops the secret from its state in `onAcknowledge` (`router.reload({ only: [...] })` or clearing the flash), so Back or a re-render never shows it again.

## AI access

A key an agent uses is an ordinary key with the same vocabulary: `mcp:read` for the read tools, `mcp:write` for the write tools, plus the resource scopes the tools touch. Creating a key with `mcp:write` is the user's explicit consent to agent writes ([ai-backend.md](ai-backend.md)). Which scopes an identity provider may ever hand to an agent is a separate decision, tracked in qiick-io/signaculum-core#154.

## Divergence

A product may differ from this page when the difference is written down with its reason, in the same place as any other difference from app-ui (`app-ui.overrides.json`). A tenancy column in a multi-tenant product, a CMS that also scopes keys to collections, or an identity provider that gates its endpoints with scope middleware are design; an undeclared rename, a boolean next to the scopes or a missing behaviour is drift.
