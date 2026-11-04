# Changelog

All notable changes to **qiick app UI** (`@qiick/app-theme` and the `@qiick` shadcn registry) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
One version covers the theme package and the registry: a release tag `vX.Y.Z` pins both.

## [Unreleased]

### Added

- `@qiick/app-theme` tokens extracted from externa-core 1.4.0: palette scales, light/dark/high-contrast colour tokens in the `base` cascade layer, `--brand-primary` accent (teal default), `--primary-hover`, sidebar and AI tokens, focus-ring rule, control-size scale (24/32/40 px), base and reduced-motion rules; documented in `packages/app-theme/README.md` (#2).
- `presets/blue.css` brand preset (Excubia), the shared base + brand-only model from externa-core `config/theme-presets.php` (#2).
- `npm run a11y:contrast`: WCAG 2.2 AA check of every token pair in light, dark and both high-contrast modes, for teal and every preset, including `--primary-hover`; runs in CI (#2).
- Playground shows the theme tokens with a preset and high-contrast switch (#2).
- npm workspaces for `@qiick/app-theme` and the shadcn registry, built with `shadcn build` into the committed `public/r` (#1).
- Vite playground that renders every registry item in light and dark mode (#1).
- CI: lint, Prettier, typecheck, build, stale `public/r` check and Conventional Commits; Dependabot (#1).
- `utils` registry item: `cn()` aware of the control-size spacing keys (#1).
