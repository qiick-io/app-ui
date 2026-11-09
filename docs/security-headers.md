# Security headers

**Copy from externa-core:** `app/Http/Middleware/SetSecurityHeadersMiddleware.php`, `config/security.php`, and its place in `bootstrap/app.php` (appended last to the `web` group) (PHP, repo root).

- Applied to `web` responses only; `api/*` and GraphQL are skipped. `SECURITY_HEADERS_ENABLED=false` turns them off for a proxy that sets its own.
- Headers and defaults (each overridable by env):

| Header                    | Default                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| `X-Content-Type-Options`  | `nosniff`                                                              |
| `X-Frame-Options`         | `DENY` (`SECURITY_X_FRAME_OPTIONS`)                                    |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`                                      |
| `Permissions-Policy`      | `camera=(), microphone=(self), geolocation=(), payment=(), usb=()`     |
| `Content-Security-Policy` | set only if the response has none; `SECURITY_CSP` replaces it verbatim |

- Default CSP: `default-src 'self'`; `script-src 'self' 'unsafe-inline' 'unsafe-eval'` plus the Vite dev origin in local; `style-src 'self' 'unsafe-inline'`; `img-src 'self' data: blob: https:` plus the files disk origin; `font-src 'self' data:`; `connect-src 'self' ws: wss: http: https:` (Reverb, AI streaming); `media-src 'self' blob:`; `worker-src 'self' blob:`; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`; `object-src 'none'`. A product adds origins it needs in `config/security.php`, never `*`.
- **HSTS** is the reverse proxy's job (TLS ends there); the Docker docs say so. The app never sets it.
- A feature test asserts the headers on a web page and their absence on `/api/v1`.
