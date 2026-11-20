# API conventions

**Registry:** the API key screen and its baseline (storage, scopes, rotation, the show-once secret) are [api-keys.md](api-keys.md).

**Copy from externa-core:** `routes/api.php`, `app/Http/Controllers/Api/V1/*Controller.php`, `app/Http/Resources/Api/V1/FileResource.php`, `app/Models/ApiKey.php`, `app/Http/Middleware/ResolveApiAccessMiddleware.php`, `app/Http/Middleware/ApiRequestCostMiddleware.php`, `app/Enums/ApiKeyScopeEnum.php`, `config/api.php`, `resources/openapi/public-cms-v1.yaml` with `OpenApiController.php` and `tests/Feature/Api/OpenApiExportTest.php` (PHP, repo root); API keys screen `pages/admin/api-keys/index.tsx`.

Only when the spec asks for a public API; the Inertia UI never calls it.

## Shape

- REST under `/api/v1` (`apiPrefix: 'api'` in `bootstrap/app.php`, `Route::prefix('v1')`). A breaking change is `/api/v2`, side by side; `v1` keeps working until a major release removes it.
- Controllers in `app/Http/Controllers/Api/V1/`, thin like the others, calling the same `*Action` / `*Service` classes as the UI (`standards/rules/code.md`, layer 5).
- Responses are `*Resource` classes in `app/Http/Resources/Api/V1/`: explicit fields, snake_case keys, ISO-8601 dates and record ids as UUID strings. No database bigint leaves the app (fleet decision 2026-11-20): a UUID is the id, not an extra field beside a numeric id. Lists paginate (`page`, `per_page` up to `config('api.max_per_page')`, 100). Registry items still accept numeric ids through `RecordId` so apps can migrate without a breaking change; see [forms.md](forms.md#record-ids).
- Errors are Laravel's JSON: `422` with `errors`, `401`, `403`, `404`, `429`. Never an HTML page under `/api`.

## OpenAPI

A hand-written OpenAPI 3.1 file in `resources/openapi/<api>-v1.yaml`, served as JSON at `GET /api/v1/openapi.json`. A test checks that every route in `routes/api.php` is in the spec and that the served file parses; an SDK, if any, is generated from it (`openapi-typescript`).

## Authentication

- API keys, not user sessions: `<prefix>_` + 40 random characters, shown once (`flash.plain_text_api_key`), stored as a SHA-256 hash plus a 12-character prefix for display. Sent as `Authorization: Bearer <key>`.
- Columns, the `<resource>:(read|write)` scope vocabulary, rotation, revocation, expiry and the activity log: [api-keys.md](api-keys.md).
- No Sanctum or Passport unless the spec needs OAuth for third parties (then Passport, asked first).

## Limits

Named rate limiters in `AppServiceProvider` (`api`: 60/min per key or IP), an optional per-key `rate_limit_per_minute`, and `X-RateLimit-Limit` / `X-RateLimit-Remaining` headers. CORS only for the origins the operator configures.
