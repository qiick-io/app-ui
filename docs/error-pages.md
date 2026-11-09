# Error pages

**Registry:** `page-layout`, `empty`, `button`.

**Copy from externa-core:** `pages/errors/not-found.tsx` (`AppLayout` + `PageLayout` + `Empty`, props `status`, `homeUrl`), `app/Http/Exceptions/RenderNotFoundResponse.php` and its `renderable` in `bootstrap/app.php` (PHP, repo root).

externa-core renders only the 404 as an Inertia page; 403 / 500 / 503 still fall through to Laravel's default HTML. New products render all four with the same page, and externa-core follows.

## Behaviour

- One page, `pages/errors/error-page.tsx` (externa's `not-found.tsx` with the status as a prop): inside the app shell when the user is signed in, the auth layout when not; `Empty` with an icon, a title, one sentence and a single action ("Back to dashboard" / "Sign in" / "Try again").
- Statuses and copy keys: `errors.403.*` (no permission: name what is missing only if the user may know it), `errors.404.*`, `errors.500.*` (no details, no stack trace; the request id if logged), `errors.503.*` (maintenance or a dependency down: "back soon").
- In `bootstrap/app.php`, `->withExceptions(fn (Exceptions $exceptions) => $exceptions->respond(...))`: for `403`, `404`, `500`, `503` and a non-JSON request, outside `app()->hasDebugModeEnabled()` for 500, render `Inertia::render('errors/error-page', ['status' => $status])->toResponse($request)->setStatusCode($status)` with the shared props. `api/*`, GraphQL and `expectsJson()` keep Laravel's JSON errors.
- Guests hitting a 404 inside the app are redirected to the login first (as `RenderNotFoundResponse`), so a URL does not reveal what exists.
- A `419` (expired session) reloads the page with a toast, never an error page.
- A browser test visits each status in light and dark and runs the axe check.
