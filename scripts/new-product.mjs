#!/usr/bin/env node
/**
 * Turns a fresh Laravel React starter-kit app into a qiick product in one step
 * (Node 24, no dependencies). Run it from an app-ui checkout at the release the
 * app will pin:
 *
 *     node scripts/new-product.mjs --target ../<app> --name <app> [--preset Teal|Blue] [--ref vX.Y.Z]
 *
 * It writes `qiick-standards.json`, adds the `@qiick` registry to
 * `components.json`, writes `.github/workflows/qiick.yml` (the reusable qiick
 * checks pinned to the same ref) and runs the standards sync. It never
 * overwrites a file the app already has, except `components.json`, where it
 * only adds the registry; an existing `qiick-standards.json` keeps its `ref`.
 * Steps it cannot do (`shadcn add`, the install command, health endpoints) are
 * printed at the end and described in `docs/new-product.md`.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncStandards } from './sync-standards.mjs';

const appUiRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRESETS = { Teal: 'theme', Blue: 'theme-blue' };

/**
 * The latest `vX.Y.Z` tag of this app-ui checkout, or `develop` before the first release.
 */
function latestReleaseTag() {
    try {
        const tags = execFileSync(
            'git',
            ['tag', '--list', 'v*', '--sort=-v:refname'],
            {
                cwd: appUiRoot,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            },
        )
            .split('\n')
            .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));

        return tags[0] ?? 'develop';
    } catch {
        return 'develop';
    }
}

/**
 * @param {string} ref
 * @param {string} appName
 */
function renderQiickWorkflow(ref, appName) {
    return `# qiick checks, from qiick-io/app-ui at the pinned release (docs/new-product.md).
# Bump the ref together with "ref" in qiick-standards.json and the @qiick URL in components.json.
name: qiick

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]
    types: [opened, edited, synchronize, reopened]

permissions:
  contents: read

jobs:
  pr-title:
    if: github.event_name == 'pull_request'
    uses: qiick-io/app-ui/.github/workflows/pr-title.yml@${ref}

  app-ui-drift:
    uses: qiick-io/app-ui/.github/workflows/drift-check.yml@${ref}
    with:
      standards: true

  ui-quality:
    uses: qiick-io/app-ui/.github/workflows/ui-quality.yml@${ref}

  migrations-frozen:
    uses: qiick-io/app-ui/.github/workflows/migrations-frozen.yml@${ref}

  distribution-smoke:
    uses: qiick-io/app-ui/.github/workflows/app-distribution-smoke.yml@${ref}
    with:
      package: qiick/${appName}
      command: ${appName}
`;
}

/**
 * @param {string} file
 * @param {string} content
 * @param {string[]} written
 */
function writeIfMissing(file, content, written) {
    if (fs.existsSync(file)) {
        return;
    }

    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    written.push(file);
}

/**
 * @param {{ targetRoot: string, appName: string, preset: string, ref: string }} options
 * @returns {string[]} Files written or changed, relative to the target
 */
export function scaffoldProduct({
    targetRoot,
    appName,
    preset,
    ref: requestedRef,
}) {
    if (!/^[a-z][a-z0-9-]*$/.test(appName)) {
        throw new Error(`--name must be kebab-case (got "${appName}").`);
    }

    if (!(preset in PRESETS)) {
        throw new Error(
            `--preset must be one of ${Object.keys(PRESETS).join(', ')}; a new brand preset is added to the registry first.`,
        );
    }

    if (!fs.existsSync(path.join(targetRoot, 'artisan'))) {
        throw new Error(
            `${targetRoot} is not a Laravel app: create it from the React starter kit first (docs/new-product.md, step 1).`,
        );
    }

    /** @type {string[]} */
    const written = [];
    const at = (file) => path.join(targetRoot, file);
    // An app that already pins a ref keeps it: every pin must name the same release.
    const ref = fs.existsSync(at('qiick-standards.json'))
        ? (JSON.parse(fs.readFileSync(at('qiick-standards.json'), 'utf8'))
              .ref ?? requestedRef)
        : requestedRef;

    writeIfMissing(
        at('qiick-standards.json'),
        `${JSON.stringify(
            {
                $comment:
                    'qiick standards pack: https://github.com/qiick-io/app-ui/tree/develop/standards',
                ref,
                uiPreset: preset,
                php: true,
                frontendRoots: ['resources/js'],
                oxlint: true,
                app: true,
            },
            null,
            4,
        )}\n`,
        written,
    );

    const componentsPath = at('components.json');

    if (fs.existsSync(componentsPath)) {
        const components = JSON.parse(fs.readFileSync(componentsPath, 'utf8'));
        const registryUrl = `https://raw.githubusercontent.com/qiick-io/app-ui/${ref}/public/r/{name}.json`;

        if (components.registries?.['@qiick'] !== registryUrl) {
            components.registries = {
                ...components.registries,
                '@qiick': registryUrl,
            };
            fs.writeFileSync(
                componentsPath,
                `${JSON.stringify(components, null, 4)}\n`,
            );
            written.push(componentsPath);
        }
    }

    writeIfMissing(
        at('.github/workflows/qiick.yml'),
        renderQiickWorkflow(ref, appName),
        written,
    );

    written.push(
        ...syncStandards(targetRoot, { isCheck: false }).map((file) =>
            at(file),
        ),
    );

    return written.map((file) => path.relative(targetRoot, file));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const option = (name, fallback) => {
        const index = process.argv.indexOf(`--${name}`);

        return index === -1 ? fallback : process.argv[index + 1];
    };
    const targetRoot = path.resolve(option('target', process.cwd()));
    const appName = option('name', path.basename(targetRoot));
    const preset = option('preset', 'Teal');
    const ref = option('ref', latestReleaseTag());

    try {
        const written = scaffoldProduct({ targetRoot, appName, preset, ref });

        console.log(`new-product: ${appName} pinned to app-ui ${ref}`);
        console.log(written.map((file) => `  wrote ${file}`).join('\n'));
        console.log(`
Next (docs/new-product.md):
  npx shadcn@latest add @qiick/theme${preset === 'Teal' ? '' : ` @qiick/${PRESETS[preset]}`} @qiick/shadcn-utilities @qiick/app-shell @qiick/nav-user @qiick/page-layout @qiick/toast --overwrite
  fill tests/Arch/naming-architecture.php, then add ${appName}:install, ${appName}:upgrade and /health/live|ready
  ask the maintainer to require the checks listed in the guide`);
    } catch (error) {
        console.error(`new-product: ${error.message}`);
        process.exit(1);
    }
}
