# Auth pages and SSO

**Registry:** `field`, `input`, `input-otp`, `button`, `checkbox`, `separator`.

**Copy from externa-core:** `pages/auth/{login,register,forgot-password,reset-password,two-factor-challenge,confirm-password,verify-email}.tsx`, `layouts/auth-layout.tsx` → `layouts/auth/auth-simple-layout.tsx`; 2FA and passkeys in `pages/settings/security.tsx`, `components/two-factor-setup-modal.tsx`, `components/two-factor-recovery-codes.tsx`, `hooks/use-two-factor-auth.ts`; `config/fortify.php` and `app/Providers/FortifyServiceProvider.php` (PHP, repo root).

## Local login (always on)

- Fortify from the starter kit, features: `registration()` (an app may turn it off), `resetPasswords()`, `emailVerification()`, `twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true])`, `passkeys(['confirmPassword' => true])`.
- The login page renders, top to bottom: the SSO button (when configured), the passkey button, a `FieldSeparator` ("or continue with email"), then email, password, remember me and the submit. Errors are `FieldError` (`docs/forms.md`).
- Rate limiters in `FortifyServiceProvider`: `login` (per email + IP), `two-factor` 5/min, `passkeys` 10/min, `auth-sensitive` 5/min for password and 2FA changes.
- A local admin always works, also in SSO-only mode (break-glass).

## SSO through Signaculum (optional)

Single sign-on is optional and off by default. Signaculum (`qiick-io/signaculum-core`) is the qiick OpenID Connect provider, but any standard IdP (Keycloak, Zitadel, Authentik, Entra ID) works the same way.

- **New products:** `composer require qiick/laravel-oidc` (`qiick-io/laravel-oidc`): PKCE `S256`, `id_token` validation, RP-initiated and back-channel logout, `(issuer, sub)` identities in `user_identities`, role mapping. `php artisan oidc:configure --issuer=… --client-id=…` checks the IdP and prints the URIs to register. Config `config/oidc.php`, env `OIDC_ENABLED`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_BUTTON_LABEL`, `OIDC_JIT`, `OIDC_AUTO_LINK`, `OIDC_ONLY`; the app may override them from its settings page. Routes `GET /auth/oidc/redirect` and `/auth/oidc/callback`.
- externa-core and excubia-app still carry their own Socialite-based client (`app/Http/Controllers/Auth/OidcController.php`, `app/Auth/Oidc/GenericOidcProvider.php`, `app/Services/Auth/OidcSocialiteFactoryService.php`, `OidcUserResolverService.php`); they move to the package once it is released. Do not copy it into a new product.
- The login button: `<Button variant="outline" asChild data-test="oidc-login-button"><a href={oidc.redirect.url()}>{oidcButtonLabel}</a></Button>`, shown only when the login view gets `canUseOidc`; an SSO failure comes back as a validation error on `email`.
- Just-in-time accounts require `email_verified`, respect the domain allowlist and get the default role.
