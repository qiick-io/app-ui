# Automated checks

Machines enforce these in CI; keep them green, and never silence one to get green.

- **Dead code.** `knip` (unused files, exports, dependencies) runs in CI with the repo's committed `knip.json`. TypeScript has `noUnusedLocals` and `noUnusedParameters` on. Delete what is unused; prefix a parameter a signature forces on you with `_`. A knip `ignore*` entry needs a comment-worthy reason in the PR.
- **Strict models.** Each app's `AppServiceProvider::boot()` calls `Model::shouldBeStrict(! app()->isProduction())`: lazy loading, silently discarded attributes and missing attributes throw outside production. Fix the query (eager load, `$fillable`, select the column), never turn it off.
- **Larastan ratchet.** Each repo runs Larastan one level above where it started. Its `phpstan-baseline.neon` may only shrink: `scripts/qiick-ratchet.mjs phpstan` fails CI when the baseline holds more errors than on the base branch (only the PR that raises `level:` may baseline that level's errors). Never add to the baseline; fix the new error.
- **No hard-coded UI strings.** `i18next/no-literal-string` (JSX text only, not attributes such as `className` or `data-*`) flags visible text that bypasses translations: use `t('…')` with keys in every locale file. Existing debt is in `i18n-literal-baseline.json`; `scripts/qiick-ratchet.mjs lint` fails when a file's count grows, and when a count shrinks without the baseline being lowered (`--update`).
