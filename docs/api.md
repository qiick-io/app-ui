# API conventions

**Registry:** API key screens use the list, dialog and destructive patterns (`docs/list-page.md`, `docs/forms.md`, `docs/destructive-actions.md`).

**Copy from externa-core:** `routes/api.php`, `app/Http/Controllers/Api/V1/*Controller.php`, `app/Http/Resources/Api/V1/FileResource.php`, `app/Models/ApiKey.php`, `app/Http/Middleware/ResolveApiAccessMiddleware.php`, `app/Http/Middleware/ApiRequestCostMiddleware.php`, `app/Enums/ApiKeyScopeEnum.php`, `config/api.php`, `resources/openapi/public-cms-v1.yaml` with `OpenApiController.php` and `tests/Feature/Api/OpenApiExportTest.php` (PHP, repo root); API keys screen `pages/admin/api-keys/index.tsx`.

Only when the spec asks for a public API; the Inertia UI never calls it.

## Shape

- REST under `/api/v1` (`apiPrefix: 'api'` in `bootstrap/app.php`, `Route::prefix('v1')`). A breaking change is `/api/v2`, side by side; `v1` keeps working until a major release removes it.
- Controllers in `app/Http/Controllers/Api/V1/`, thin like the others, calling the same `*Action` / `*Service` classes as the UI (`standards/rules/code.md`, layer 5).
- Responses are `*Resource` classes in `app/Http/Resources/Api/V1/`: explicit fields, snake_case keys, ISO-8601 dates, ids as numbers plus a `uuid` where records are shared. Lists paginate (`page`, `per_page` up to `config('api.max_per_page')`, 100).
- Errors are Laravel's JSON: `422` with `errors`, `401`, `403`, `404`, `429`. Never an HTML page under `/api`.

## OpenAPI

A hand-written OpenAPI 3.1 file in `resources/openapi/<api>-v1.yaml`, served as JSON at `GET /api/v1/openapi.json`. A test checks that every route in `routes/api.php` is in the spec and that the served file parses; an SDK, if any, is generated from it (`openapi-typescript`).

## Authentication

- API keys, not user sessions: `<prefix>_` + 40 random characters, shown once (`flash.plain_text_api_key`), stored as a SHA-256 hash plus a 12-character prefix for display. Sent as `Authorization: Bearer <key>`.
- Each key has an owner, a role, `read_only`, `scopes` (a `*ScopeEnum`, `resource:read` / `resource:write`), an optional IP allowlist (CIDR), `expires_at` and `revoked_at`; creating, revoking and using keys is in the activity log.
- No Sanctum or Passport unless the spec needs OAuth for third parties (then Passport, asked first).

## Limits

Named rate limiters in `AppServiceProvider` (`api`: 60/min per key or IP), an optional per-key `rate_limit_per_minute`, and `X-RateLimit-Limit` / `X-RateLimit-Remaining` headers. CORS only for the origins the operator configures.
