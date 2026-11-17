#!/usr/bin/env node
/**
 * Drift check between an app and the qiick registry (#5).
 *
 * Run from the app root (Node 20+, no dependencies):
 *
 *     node check-drift.mjs [--cwd <app root>]
 *
 * - Reads the `@qiick` registry URL from the app's `components.json`; the
 *   release tag in it (`…/app-ui/vX.Y.Z/public/r/{name}.json`, #4) is the
 *   registry version compared against. A local path template also works.
 * - An item counts as installed when any of its files exists in the app. Every
 *   file of an installed item must match the registry byte for byte (line
 *   endings aside), unless `app-ui.overrides.json` lists it with a reason:
 *
 *       { "resources/js/components/ui/button.tsx": "Why it differs" }
 *
 * - A file of an installed item the app leaves out on purpose is listed the
 *   same way; its reason says why it is missing.
 * - Fails on any unexplained difference (printing a diff), on a missing file of
 *   an installed item without an override, and on an override that is not
 *   needed (file matches) or not a registry file.
 *
 * That half proves the fidelity of what an app took, and is blind to what it
 * never took: an app that builds its own screen instead of installing the item
 * stays green. So `qiick-standards.json` also names the items the product must
 * install, and the ones it leaves out on purpose with a reason, the overrides
 * idea one level up (an item instead of a file):
 *
 *       { "requiredItems": ["page-layout"], "divergences": { "page-layout": "Why" } }
 *
 * - Fails on a required item that is not installed and has no divergence, and
 *   on a divergence whose item is installed (it no longer diverges; a file that
 *   differs belongs in `app-ui.overrides.json`), not required, or has no reason.
 */
import fs from 'node:fs';
import path from 'node:path';

const OVERRIDES_FILE = 'app-ui.overrides.json';
const STANDARDS_FILE = 'qiick-standards.json';
const cwdFlag = process.argv.indexOf('--cwd');
const appRoot = path.resolve(
    cwdFlag === -1 ? process.cwd() : process.argv[cwdFlag + 1],
);

/**
 * @param {string} file - Path relative to the app root
 */
function readAppJson(file) {
    return JSON.parse(fs.readFileSync(path.join(appRoot, file), 'utf8'));
}

/**
 * @param {string} template - Registry URL or path with `{name}`
 * @param {string} name - Item name
 */
async function fetchRegistryJson(template, name) {
    const location = template.replace('{name}', name);

    if (!/^https?:\/\//.test(location)) {
        return JSON.parse(
            fs.readFileSync(path.resolve(appRoot, location), 'utf8'),
        );
    }

    const response = await fetch(location);

    if (!response.ok) {
        throw new Error(`${location}: HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Where `shadcn add` writes a registry file: its `target`, or its path under
 * `src/` placed in the directory the app's `@/*` alias points to.
 * @param {{ path: string, target?: string }} file
 * @param {string} aliasRoot
 */
function appPathOf(file, aliasRoot) {
    return (
        file.target ??
        path.posix.join(aliasRoot, file.path.replace(/^src\//, ''))
    );
}

/**
 * Minimal unified-style line diff (LCS), enough to show what changed.
 * @param {string} expected
 * @param {string} actual
 */
function lineDiff(expected, actual) {
    const a = expected.split('\n');
    const b = actual.split('\n');
    const lengths = Array.from(
        { length: a.length + 1 },
        () => new Uint32Array(b.length + 1),
    );

    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            lengths[i][j] =
                a[i] === b[j]
                    ? lengths[i + 1][j + 1] + 1
                    : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
        }
    }

    /** @type {string[]} */
    const lines = [];
    let i = 0;
    let j = 0;

    while (i < a.length || j < b.length) {
        if (i < a.length && j < b.length && a[i] === b[j]) {
            i++;
            j++;
        } else if (
            j < b.length &&
            (i === a.length || lengths[i][j + 1] > lengths[i + 1][j])
        ) {
            lines.push(`  + ${j + 1}: ${b[j]}`);
            j++;
        } else {
            lines.push(`  - ${i + 1}: ${a[i]}`);
            i++;
        }
    }

    return lines.join('\n');
}

const normalize = (text) => text.replace(/\r\n/g, '\n');

const components = readAppJson('components.json');
const template = components.registries?.['@qiick'];

if (typeof template !== 'string') {
    console.error(
        'check-drift: components.json has no "registries": { "@qiick": … } entry.',
    );
    process.exit(1);
}

const version =
    template.match(/qiick-io\/app-ui\/([^/]+)\/public\/r\//)?.[1] ?? template;
// tsconfig.json is JSONC (comments), so read the `@/*` path with a pattern.
const aliasTarget =
    fs
        .readFileSync(path.join(appRoot, 'tsconfig.json'), 'utf8')
        .match(/"@\/\*"\s*:\s*\[\s*"([^"]+)"/)?.[1] ?? './resources/js/*';
const aliasRoot = path.posix.normalize(aliasTarget.replace(/\*$/, ''));
/** @type {Record<string, string>} */
const overrides = fs.existsSync(path.join(appRoot, OVERRIDES_FILE))
    ? readAppJson(OVERRIDES_FILE)
    : {};
/** @type {{ requiredItems?: unknown, divergences?: unknown }} */
const standards = fs.existsSync(path.join(appRoot, STANDARDS_FILE))
    ? readAppJson(STANDARDS_FILE)
    : {};
const requiredItems = standards.requiredItems ?? [];
const divergences = standards.divergences ?? {};

if (
    !Array.isArray(requiredItems) ||
    requiredItems.some((name) => typeof name !== 'string') ||
    typeof divergences !== 'object' ||
    Array.isArray(divergences) ||
    divergences === null
) {
    console.error(
        `check-drift: ${STANDARDS_FILE} needs "requiredItems" as a list of item names and "divergences" as { "<item>": "<reason>" }.`,
    );
    process.exit(1);
}

const index = await fetchRegistryJson(template, 'registry');
/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const coverageErrors = [];
const usedOverrides = new Set();
const registryFiles = new Set();
const installedItems = new Set();
let checkedFiles = 0;

for (const [file, reason] of Object.entries(overrides)) {
    if (typeof reason !== 'string' || reason.trim() === '') {
        errors.push(`${OVERRIDES_FILE}: "${file}" needs a reason.`);
    }
}

for (const { name } of index.items) {
    const item = await fetchRegistryJson(template, name);
    const files = item.files.map((file) => ({
        appPath: appPathOf(file, aliasRoot),
        content: normalize(file.content),
    }));
    const isInstalled = files.some(({ appPath }) =>
        fs.existsSync(path.join(appRoot, appPath)),
    );

    if (!isInstalled) {
        continue;
    }

    installedItems.add(name);

    for (const { appPath, content } of files) {
        registryFiles.add(appPath);
        const absolutePath = path.join(appRoot, appPath);

        if (!fs.existsSync(absolutePath)) {
            // An app may leave out a file of an installed item on purpose (e.g. the
            // source app keeps that code elsewhere); the override gives the reason.
            if (appPath in overrides) {
                usedOverrides.add(appPath);
            } else {
                errors.push(`${appPath} (${name}) is missing.`);
            }

            continue;
        }

        checkedFiles++;
        const actual = normalize(fs.readFileSync(absolutePath, 'utf8'));

        if (actual === content) {
            if (appPath in overrides) {
                errors.push(
                    `${appPath} matches the registry again: remove it from ${OVERRIDES_FILE}.`,
                );
            }

            continue;
        }

        if (appPath in overrides) {
            usedOverrides.add(appPath);
            continue;
        }

        errors.push(
            `${appPath} (${name}) differs from the registry (- registry, + app):\n${lineDiff(content, actual)}`,
        );
    }
}

for (const file of Object.keys(overrides)) {
    if (!registryFiles.has(file)) {
        errors.push(
            `${OVERRIDES_FILE}: "${file}" is not a file of an installed registry item.`,
        );
    }
}

const registryItems = new Set(index.items.map(({ name }) => name));
const seenRequiredItems = new Set();

for (const name of requiredItems) {
    if (seenRequiredItems.has(name)) {
        coverageErrors.push(
            `${STANDARDS_FILE}: "${name}" is listed twice in "requiredItems".`,
        );
    }

    seenRequiredItems.add(name);

    if (!registryItems.has(name)) {
        coverageErrors.push(
            `${STANDARDS_FILE}: "${name}" in "requiredItems" is not an item of the @qiick registry ${version}.`,
        );
        continue;
    }

    const isDeclaredDivergence = name in divergences;

    if (!installedItems.has(name) && !isDeclaredDivergence) {
        coverageErrors.push(
            `${name} is a required item and is not installed: run npx shadcn add @qiick/${name}, or list it under "divergences" in ${STANDARDS_FILE} with a reason.`,
        );
    }

    // A divergence that outlives its reason turns the map into a list nobody
    // trusts, so an installed item must leave it, as an unneeded override does.
    if (installedItems.has(name) && isDeclaredDivergence) {
        coverageErrors.push(
            `${name} is installed: remove it from "divergences" in ${STANDARDS_FILE} (a file that differs belongs in ${OVERRIDES_FILE}).`,
        );
    }
}

for (const [name, reason] of Object.entries(divergences)) {
    if (typeof reason !== 'string' || reason.trim() === '') {
        coverageErrors.push(
            `${STANDARDS_FILE}: divergence "${name}" needs a reason.`,
        );
    }

    if (!seenRequiredItems.has(name)) {
        coverageErrors.push(
            `${STANDARDS_FILE}: divergence "${name}" is not in "requiredItems".`,
        );
    }
}

console.log(`check-drift: @qiick registry ${version}`);

if (errors.length > 0 || coverageErrors.length > 0) {
    console.error(`\n${[...errors, ...coverageErrors].join('\n\n')}`);

    if (errors.length > 0) {
        console.error(
            `\nInstall the registry version again (npx shadcn add @qiick/<name> --overwrite) or list the file in ${OVERRIDES_FILE} with a reason.`,
        );
    }

    process.exit(1);
}

const divergentCount = Object.keys(divergences).length;

console.log(
    `check-drift: ok (${checkedFiles} files match, ${usedOverrides.size} overridden; ${requiredItems.length - divergentCount} required items installed, ${divergentCount} divergent)`,
);
