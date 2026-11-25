#!/usr/bin/env node
/**
 * Writes the qiick standards pack into a repo, or checks that the repo's copy
 * still matches (Node 20+, no dependencies).
 *
 *     node sync-standards.mjs [--target <repo root>] [--check]
 *
 * The sources are `standards/` next to this script. The target repo describes
 * itself in `qiick-standards.json`:
 *
 *     {
 *         "ref": "vX.Y.Z",                 // app-ui tag (or branch) its CI checks against
 *         "uiPreset": "Teal",              // brand preset; omit in repos without a UI
 *         "php": true,                     // Pest architecture test
 *         "frontendRoots": ["resources/js"], // kebab-case file name check
 *         "oxlint": true,                  // Vite+ apps: the shared Oxlint configs
 *         "eslint": true,                  // repos still on ESLint: the shared ESLint config
 *         "app": true,                     // self-hosted app: stack and distribution rules
 *         "package": true,                 // Composer package: must consume package-matrix.yml
 *         "erasure": true,                 // package with an eraser: gets tests/Erasure (false: no personal data)
 *         "erasureExemptReason": "…",      // required with "erasure": false: why the package holds no personal data
 *         "patterns": ["command-palette"], // optional UI patterns it adopts (standards/patterns.json)
 *         "requiredItems": ["page-layout"], // registry items it must install (check-drift.mjs)
 *         "divergences": {                  // registry strings and/or conformance objects
 *             "page-layout": "Why",
 *             "C12": { "reason": "…", "decision": "knowledge/decisions/…", "review_by": "YYYY-MM-DD" }
 *         },
 *         "conformance": { "userModel": "App\\Models\\User", "apiPrefix": "api/v1" },
 *         "conventions": { "divergences": {} } // fleet conventions F1-F30 (check-conventions.mjs)
 *     }
 *
 * Managed files are of two kinds:
 *
 * - whole files (`.cursor/rules/*.mdc`, the architecture test, …): the repo's
 *   copy must match byte for byte (line endings aside);
 *   `.qiick/standards/<page>.md` holds every rule page in full;
 * - blocks inside `AGENTS.md`, `CLAUDE.md` and `.github/copilot-instructions.md`
 *   between the `qiick-standards:begin` / `:end` markers: only the block is
 *   managed; everything outside it (repo rules, Laravel Boost guidelines) is the
 *   repo's own.
 *
 * `--check` fails on a missing or different managed file or block, on a
 * frontend file or directory name that is not kebab-case, on graphify git
 * hygiene (`.gitignore` must ignore `graphify-out/`, no tracked `graphify-out/`
 * path, and `.gitattributes` must not contain `merge=graphify`), and — when
 * `"package": true` — on a CI matrix that does not consume package-matrix.yml
 * (see docs/package-matrix.md), and — with a `conventions` object — on a fleet
 * convention its source breaks (standards/rules/conventions.md).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findConventionViolations } from '../standards/scripts/check-conventions.mjs';
import { findPackageMatrixViolations } from '../standards/scripts/check-package-matrix.mjs';

const CONFIG_FILE = 'qiick-standards.json';
const SOURCE_URL = 'https://github.com/qiick-io/app-ui/tree/develop/standards';
const NEW_PRODUCT_URL =
    'https://github.com/qiick-io/app-ui/blob/develop/docs/new-product.md';
const BLOCK_BEGIN =
    '<!-- qiick-standards:begin. Generated from qiick-io/app-ui standards: do not edit inside this block, run the sync (see qiick-standards.json). -->';
const BLOCK_END = '<!-- qiick-standards:end -->';
/** Splits a rule page: above it, the always-loaded core; below it, details read on demand. */
const DETAIL_MARKER = /^<!-- qiick-standards:detail when: (.+?) -->\n+/m;
const DETAIL_DIRECTORY = '.qiick/standards';
const DOCS_URL = 'https://github.com/qiick-io/app-ui/blob/develop';
const KEBAB_CASE_NAME =
    /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

const standardsRoot = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'standards',
);

const normalize = (text) => text.replace(/\r\n/g, '\n');

/**
 * @param {string} relativePath - Path under `standards/`
 */
function readSource(relativePath) {
    return normalize(
        fs.readFileSync(path.join(standardsRoot, relativePath), 'utf8'),
    );
}

/**
 * Every file under a directory, recursively.
 * @param {string} directory
 * @returns {string[]} Absolute paths
 */
function listFilesRecursive(directory) {
    /** @type {string[]} */
    const files = [];

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolutePath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            files.push(...listFilesRecursive(absolutePath));
        } else if (entry.isFile()) {
            files.push(absolutePath);
        }
    }

    return files;
}

/**
 * @typedef {{ title: string, page: string, variants?: string[] }} OptionalPattern
 * @typedef {Record<string, OptionalPattern>} PatternCatalogue
 */

/**
 * The optional UI patterns an app may adopt (`standards/patterns.json`).
 * @returns {PatternCatalogue}
 */
function readPatternCatalogue() {
    return JSON.parse(readSource('patterns.json')).patterns;
}

/**
 * Checks the `patterns` an app declares against the catalogue: every name must
 * exist, and a pattern with variants needs exactly one of them (`name:variant`),
 * so the agent files can tell which accepted variant this app follows.
 * @param {{ patterns?: unknown }} config
 * @param {PatternCatalogue} catalogue
 * @returns {string[]} Errors, empty when the declaration is valid
 */
export function validatePatterns(config, catalogue) {
    if (config.patterns === undefined) {
        return [];
    }

    if (
        !Array.isArray(config.patterns) ||
        config.patterns.some((entry) => typeof entry !== 'string')
    ) {
        return [`${CONFIG_FILE}: "patterns" must be a list of names.`];
    }

    /** @type {string[]} */
    const errors = [];
    const seenNames = new Set();

    for (const entry of config.patterns) {
        const [name, variant] = entry.split(':');
        const pattern = catalogue[name];

        if (!pattern) {
            errors.push(
                `${CONFIG_FILE}: "${name}" is not an optional pattern (see standards/patterns.json).`,
            );
            continue;
        }

        if (seenNames.has(name)) {
            errors.push(`${CONFIG_FILE}: "${name}" is listed twice.`);
        }

        seenNames.add(name);
        const variants = pattern.variants ?? [];

        if (variants.length > 0 && !variants.includes(variant)) {
            errors.push(
                `${CONFIG_FILE}: "${name}" needs one of its variants: ${variants.map((candidate) => `"${name}:${candidate}"`).join(', ')}.`,
            );
        }

        if (variants.length === 0 && variant !== undefined) {
            errors.push(`${CONFIG_FILE}: "${name}" has no variants.`);
        }
    }

    return errors;
}

/**
 * The sentence the UI rules show for the optional patterns this app adopts.
 * @param {string[]} adoptedPatterns - `name` or `name:variant` entries, already validated
 * @param {PatternCatalogue} catalogue
 */
function describeAdoptedPatterns(adoptedPatterns, catalogue) {
    if (adoptedPatterns.length === 0) {
        return 'none';
    }

    return adoptedPatterns
        .map((entry) => {
            const [name, variant] = entry.split(':');
            const label = variant ? `${name} (${variant})` : name;

            return `[${label}](${DOCS_URL}/${catalogue[name].page})`;
        })
        .join(', ');
}

/**
 * Pushes every Markdown heading one level down, outside code fences, so a rule
 * page (`# Testing`) nests under the pack title.
 * @param {string} markdown
 */
function demoteHeadings(markdown) {
    let isInsideFence = false;

    return markdown
        .split('\n')
        .map((line) => {
            if (line.startsWith('```')) {
                isInsideFence = !isInsideFence;
            }

            return !isInsideFence && /^#+ /.test(line) ? `#${line}` : line;
        })
        .join('\n');
}

/**
 * @param {{ uiPreset?: string, app?: boolean, php?: boolean, package?: boolean, patterns?: string[] }} config
 * @param {PatternCatalogue} catalogue
 * @returns {Record<string, string>} Rule page name => Markdown
 */
function renderRulePages(config, catalogue) {
    /** @type {Record<string, string>} */
    const pages = {
        ...(config.app ? { stack: readSource('rules/stack.md') } : {}),
        code: readSource('rules/code.md'),
        graphify: readSource('rules/graphify.md'),
        ...(config.php
            ? {
                  backend: readSource('rules/backend.md'),
                  conventions: readSource('rules/conventions.md'),
                  erasure: readSource('rules/erasure.md'),
              }
            : {}),
        ...(config.package
            ? { dependencies: readSource('rules/dependencies.md') }
            : {}),
        testing: readSource('rules/testing.md'),
        git: readSource('rules/git.md'),
        repository: readSource('rules/repository.md'),
        operations: readSource('rules/operations.md'),
        release: readSource('rules/release.md'),
        checks: readSource('rules/checks.md'),
    };

    if (config.app) {
        pages.distribution = readSource('rules/distribution.md');
    }

    if (config.uiPreset) {
        pages.ui = readSource('rules/ui.md')
            .replace('{{preset}}', config.uiPreset)
            .replace(
                '{{patterns}}',
                describeAdoptedPatterns(config.patterns ?? [], catalogue),
            )
            .replace('{{catalogue}}', renderCatalogueTable(catalogue));
    }

    return pages;
}

/**
 * The optional patterns as a Markdown table for the UI details page.
 * @param {PatternCatalogue} catalogue
 */
function renderCatalogueTable(catalogue) {
    const entries = Object.entries(catalogue);

    if (entries.length === 0) {
        return 'No optional pattern is published yet.';
    }

    const rows = entries.map(([name, pattern]) => {
        const variants = pattern.variants ?? [];
        const declarations =
            variants.length === 0
                ? [name]
                : variants.map((variant) => `${name}:${variant}`);

        return [
            pattern.title,
            declarations.map((declaration) => `\`${declaration}\``).join(', '),
            `${DOCS_URL}/${pattern.page}`,
        ];
    });

    return markdownTable(
        ['Optional pattern', 'Name in `patterns`', 'Page'],
        rows,
    );
}

/**
 * A Markdown table with padded columns, as Prettier writes it, so a repo that
 * formats its Markdown never rewrites the managed files.
 * @param {string[]} header
 * @param {string[][]} rows
 */
function markdownTable(header, rows) {
    const widths = header.map((cell, column) =>
        Math.max(cell.length, ...rows.map((row) => row[column].length)),
    );
    const line = (cells) =>
        `| ${cells.map((cell, column) => cell.padEnd(widths[column])).join(' | ')} |`;

    return [
        line(header),
        `| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`,
        ...rows.map(line),
    ].join('\n');
}

/**
 * A rule page as the agent files show it: the core, then one pointer to the
 * page's details in `.qiick/standards/`, naming when to read them (the agent
 * files are loaded on every turn, the details only when a task needs them).
 * A page without the detail marker is shown whole.
 * @param {string} name - Rule page name (`code`, `ui`, …)
 * @param {string} page - Markdown with an optional detail marker
 */
function corePage(name, page) {
    const marker = page.match(DETAIL_MARKER);

    if (!marker) {
        return page;
    }

    const core = page.slice(0, marker.index).trimEnd();

    return `${core}\n\n**Details:** \`${DETAIL_DIRECTORY}/${name}.md\`. Read it before ${marker[1]}.`;
}

/**
 * A rule page in full, for `.qiick/standards/` and the Cursor rules.
 * @param {string} page - Markdown with an optional detail marker
 */
const fullPage = (page) => page.replace(DETAIL_MARKER, '');

/**
 * @param {string} body
 */
const block = (body) => `${BLOCK_BEGIN}\n\n${body.trim()}\n\n${BLOCK_END}`;

/**
 * @param {string} description
 * @param {string} frontmatter - `alwaysApply` / `globs` lines
 * @param {string} body
 */
const cursorRule = (description, frontmatter, body) =>
    `---\ndescription: ${description}\n${frontmatter}\n---\n\n<!-- Generated from qiick-io/app-ui standards: do not edit, run the sync. Repo-only rules go in AGENTS.md or another .mdc file. -->\n\n${body.trim()}\n`;

/**
 * Everything the pack writes into a repo with this config.
 * @param {{ uiPreset?: string, php?: boolean, eslint?: boolean, oxlint?: boolean, app?: boolean, package?: boolean, conventions?: object, frontendRoots?: string[], patterns?: string[], erasure?: boolean }} config
 * @param {PatternCatalogue} [catalogue] - Defaults to `standards/patterns.json`
 * @returns {{ path: string, kind: 'file' | 'block' | 'template', content: string }[]}
 */
export function renderOutputs(config, catalogue = readPatternCatalogue()) {
    const pages = renderRulePages(config, catalogue);
    const agentsBody = [
        '# qiick standards',
        `These rules bind every agent and contributor in this repo from the first task. They are the same in every qiick repo (source: ${SOURCE_URL}), and CI fails when this block differs from the source. Rules for this repo only live outside this block; where they are more specific, they win. Starting a new qiick product: ${NEW_PRODUCT_URL}.`,
        ...Object.entries(pages).map(([name, page]) =>
            demoteHeadings(corePage(name, page).trim()),
        ),
    ].join('\n\n');

    /** @type {{ path: string, kind: 'file' | 'block' | 'template', content: string }[]} */
    const outputs = [
        { path: 'AGENTS.md', kind: 'block', content: block(agentsBody) },
        {
            path: 'CLAUDE.md',
            kind: 'block',
            content: block(
                "@AGENTS.md\n\nRead and follow `AGENTS.md` (imported above): the qiick standards and this repo's own rules.",
            ),
        },
        {
            path: '.github/copilot-instructions.md',
            kind: 'block',
            content: block(
                `${agentsBody}\n\n---\n\nThis repo's own rules are in \`AGENTS.md\`: read them too.`,
            ),
        },
        {
            path: '.cursor/rules/code-craftsmanship.mdc',
            kind: 'file',
            content: cursorRule(
                'qiick code standard: names, suffixes, architecture, docs, contracts, CI checks, git',
                'alwaysApply: true',
                [
                    pages.stack,
                    pages.code,
                    pages.graphify,
                    pages.backend,
                    pages.conventions,
                    pages.dependencies,
                    pages.checks,
                    pages.git,
                    pages.repository,
                    pages.operations,
                    pages.distribution,
                ]
                    .filter(Boolean)
                    .map(fullPage)
                    .map((page, index) =>
                        index === 0 ? page.trim() : demoteHeadings(page.trim()),
                    )
                    .join('\n\n'),
            ),
        },
        {
            path: '.cursor/rules/testing.mdc',
            kind: 'file',
            content: cursorRule(
                'qiick testing rules: Pest, browser tests, architecture test',
                'globs: "**/*Test.php,**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx"\nalwaysApply: false',
                fullPage(pages.testing),
            ),
        },
        {
            path: '.cursor/rules/no-auto-release.mdc',
            kind: 'file',
            content: cursorRule(
                'Never release, tag or merge to main without the maintainer',
                'alwaysApply: true',
                fullPage(pages.release),
            ),
        },
        {
            path: '.cursor/commands/code-comments.md',
            kind: 'file',
            content: readSource('rules/comments.md'),
        },
    ];

    if (config.package) {
        outputs.push({
            path: 'docs/dependencies.md',
            kind: 'template',
            content: readSource('templates/dependencies.md'),
        });
    }

    // Fleet convention F12 / F18 / F20 / F22 / F29 / F30 starting points, written once when a repo adopts the conventions.
    if (config.conventions) {
        const conventionTemplates = config.package
            ? {
                  'docs/public-api.md': 'public-api.md',
                  'docs/security-checklist.md': 'security-checklist.md',
              }
            : config.app
              ? {
                    'docs/beta-readiness.md': 'beta-readiness.md',
                    'docs/runbooks/secrets.md': 'runbook-secrets.md',
                    'docs/runbooks/backup.md': 'runbook-backup.md',
                    'docs/runbooks/deploy.md': 'runbook-deploy.md',
                    'docs/runbooks/incident.md': 'runbook-incident.md',
                    'docs/privacy.md': 'privacy.md',
                }
              : {};

        for (const [targetPath, template] of Object.entries(
            conventionTemplates,
        )) {
            outputs.push({
                path: targetPath,
                kind: 'template',
                content: readSource(`templates/${template}`),
            });
        }
    }

    for (const [name, page] of Object.entries(pages)) {
        outputs.push({
            path: `${DETAIL_DIRECTORY}/${name}.md`,
            kind: 'file',
            content: `<!-- Generated from qiick-io/app-ui standards: do not edit, run the sync. The agent files hold the core of this page and point here. -->\n\n${fullPage(page).trim()}\n`,
        });
    }

    if (pages.ui) {
        outputs.push({
            path: '.cursor/rules/accessibility-and-theme.mdc',
            kind: 'file',
            content: cursorRule(
                'qiick app UI: registry first, theme tokens, WCAG 2.2 AA',
                'globs: "**/*.tsx"\nalwaysApply: false',
                fullPage(pages.ui),
            ),
        });
    }

    if (config.php) {
        outputs.push(
            {
                path: 'tests/Arch/NamingArchitectureTest.php',
                kind: 'file',
                content: readSource('php/NamingArchitectureTest.php'),
            },
            {
                path: 'tests/Arch/naming-architecture.php',
                kind: 'template',
                content: readSource('php/naming-architecture.php'),
            },
        );

        // Fleet conformance suite: every managed file under standards/php/conformance/
        // except the repo-owned hooks.php template.
        const conformanceRoot = path.join(standardsRoot, 'php/conformance');

        for (const absolutePath of listFilesRecursive(conformanceRoot)) {
            const relative = path.relative(conformanceRoot, absolutePath);
            const posixRelative = relative.split(path.sep).join('/');

            if (posixRelative === 'hooks.php') {
                outputs.push({
                    path: 'tests/Conformance/hooks.php',
                    kind: 'template',
                    content: readSource('php/conformance/hooks.php'),
                });
                continue;
            }

            outputs.push({
                path: `tests/Conformance/${posixRelative}`,
                kind: 'file',
                content: readSource(`php/conformance/${posixRelative}`),
            });
        }
    }

    // Package erasure suite (E1–E14): opt-in, so a re-sync never turns a package
    // red before it has an eraser; each package sets `"erasure": true` in the PR
    // that adds its eraser. fixture.php is the package's own.
    if (config.php && config.erasure === true) {
        const erasureRoot = path.join(standardsRoot, 'php/erasure');

        for (const absolutePath of listFilesRecursive(erasureRoot)) {
            const posixRelative = path
                .relative(erasureRoot, absolutePath)
                .split(path.sep)
                .join('/');

            outputs.push({
                path: `tests/Erasure/${posixRelative}`,
                kind: posixRelative === 'fixture.php' ? 'template' : 'file',
                content: readSource(`php/erasure/${posixRelative}`),
            });
        }
    }

    // Laravel apps with the qiick UI: the theme-token ratchet over resources/js
    // (raw palette / #hex debt in the repo's own baseline, arbitrary font sizes never).
    if (config.php && config.uiPreset) {
        outputs.push(
            {
                path: 'scripts/check-ui-tokens.mjs',
                kind: 'file',
                content: readSource('scripts/check-ui-tokens.mjs'),
            },
            {
                path: 'scripts/ui-token-baseline.txt',
                kind: 'template',
                content: readSource('templates/ui-token-baseline.txt'),
            },
        );
    }

    outputs.push({
        path: 'scripts/qiick-ratchet.mjs',
        kind: 'file',
        content: readSource('scripts/qiick-ratchet.mjs'),
    });

    // Repos with a frontend: the legacy web platform ratchet over Chrome's
    // `legacy-scan`, with the repo's own measured baseline (rules/checks.md).
    if ((config.frontendRoots ?? []).length > 0) {
        outputs.push(
            {
                path: 'knip.json',
                kind: 'template',
                content: readSource('templates/knip.json'),
            },
            {
                path: 'scripts/check-legacy-web.mjs',
                kind: 'file',
                content: readSource('scripts/check-legacy-web.mjs'),
            },
            {
                path: 'legacy-scan-baseline.json',
                kind: 'template',
                content: readSource('templates/legacy-scan-baseline.json'),
            },
        );
    }

    if (config.eslint) {
        outputs.push({
            path: 'qiick-standards.eslint.js',
            kind: 'file',
            content: readSource('eslint/qiick-standards.eslint.js'),
        });
    }

    // Vite+ apps: the ratcheted rules and the i18n ratchet as Oxlint configs
    // (excubia-app's, the reference since 2026-11-09).
    if (config.oxlint) {
        outputs.push(
            {
                path: '.oxlintrc.standards.json',
                kind: 'file',
                content: readSource('oxlint/oxlintrc.standards.json'),
            },
            {
                path: '.oxlintrc.i18n.json',
                kind: 'file',
                content: readSource('oxlint/oxlintrc.i18n.json'),
            },
        );
    }

    return outputs;
}

/**
 * @param {string} text
 * @returns {{ start: number, end: number } | null} Offsets of the managed block
 */
function findBlock(text) {
    const start = text.indexOf('<!-- qiick-standards:begin');
    const endMarker = text.indexOf(BLOCK_END, start);

    if (start === -1 || endMarker === -1) {
        return null;
    }

    return { start, end: endMarker + BLOCK_END.length };
}

/**
 * Inserts or replaces the managed block; a new block goes at the top.
 * @param {string} existing
 * @param {string} managedBlock
 */
function withBlock(existing, managedBlock) {
    const range = findBlock(existing);

    if (range) {
        return (
            existing.slice(0, range.start) +
            managedBlock +
            existing.slice(range.end)
        );
    }

    return existing.trim() === ''
        ? `${managedBlock}\n`
        : `${managedBlock}\n\n${existing}`;
}

/**
 * Files under the frontend roots: the repo's tracked and untracked files when it
 * is a git checkout (so gitignored output such as Wayfinder's is skipped),
 * otherwise everything on disk except `node_modules` and dot entries.
 * @param {string} targetRoot
 * @param {string[]} frontendRoots
 * @returns {string[]} Paths relative to the target root
 */
function listFrontendFiles(targetRoot, frontendRoots) {
    if (frontendRoots.length === 0) {
        return [];
    }

    try {
        return execFileSync(
            'git',
            [
                'ls-files',
                '--cached',
                '--others',
                '--exclude-standard',
                '--',
                ...frontendRoots,
            ],
            {
                cwd: targetRoot,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            },
        )
            .split('\n')
            .filter(
                (file) =>
                    file !== '' && fs.existsSync(path.join(targetRoot, file)),
            );
    } catch {
        /** @type {string[]} */
        const files = [];
        /**
         * @param {string} directory - Path relative to the target root
         */
        const walk = (directory) => {
            for (const entry of fs.readdirSync(
                path.join(targetRoot, directory),
                {
                    withFileTypes: true,
                },
            )) {
                if (
                    entry.name === 'node_modules' ||
                    entry.name.startsWith('.')
                ) {
                    continue;
                }

                const relativePath = path.posix.join(directory, entry.name);

                if (entry.isDirectory()) {
                    walk(relativePath);
                } else {
                    files.push(relativePath);
                }
            }
        };

        for (const root of frontendRoots) {
            if (fs.existsSync(path.join(targetRoot, root))) {
                walk(root);
            }
        }

        return files;
    }
}

/**
 * Whether `.gitignore` ignores the local `graphify-out/` directory.
 * Accepts the usual forms (`graphify-out/`, `/graphify-out/`, `graphify-out`).
 * @param {string} gitignoreText
 */
export function ignoresGraphifyOut(gitignoreText) {
    for (const rawLine of gitignoreText.split('\n')) {
        const line = rawLine.replace(/#.*$/, '').trim();

        if (line === '' || line.startsWith('!')) {
            continue;
        }

        const pattern = line.replace(/^\//, '').replace(/\/$/, '');

        if (pattern === 'graphify-out' || pattern === '**/graphify-out') {
            return true;
        }
    }

    return false;
}

/**
 * Graphify must stay local: ignored, untracked, and without a committed
 * merge-driver line from `graphify hook install`.
 * @param {string} targetRoot
 * @returns {string[]} Errors, empty when the repo is clean
 */
export function findGraphifyGitViolations(targetRoot) {
    /** @type {string[]} */
    const errors = [];
    const gitignorePath = path.join(targetRoot, '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
        errors.push(
            '.gitignore is missing (must ignore graphify-out/; local graph, never committed).',
        );
    } else if (
        !ignoresGraphifyOut(normalize(fs.readFileSync(gitignorePath, 'utf8')))
    ) {
        errors.push(
            '.gitignore must ignore graphify-out/ (local graph, never committed).',
        );
    }

    try {
        const tracked = execFileSync(
            'git',
            ['ls-files', '-z', '--', 'graphify-out', 'graphify-out/**'],
            {
                cwd: targetRoot,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            },
        )
            .split('\0')
            .filter(Boolean);

        if (tracked.length > 0) {
            errors.push(
                `tracked graphify-out path: ${tracked[0]} (local graph, never committed).`,
            );
        }
    } catch {
        // Not a git checkout: nothing can be tracked.
    }

    const gitattributesPath = path.join(targetRoot, '.gitattributes');

    if (fs.existsSync(gitattributesPath)) {
        const gitattributes = normalize(
            fs.readFileSync(gitattributesPath, 'utf8'),
        );

        if (/merge\s*=\s*graphify\b/.test(gitattributes)) {
            errors.push(
                '.gitattributes must not contain merge=graphify (from `graphify hook install`; local only, do not commit).',
            );
        }
    }

    return errors;
}

/**
 * Directory and file names under the frontend roots that are not kebab-case.
 * @param {string} targetRoot
 * @param {string[]} frontendRoots
 */
export function findNonKebabCaseNames(targetRoot, frontendRoots) {
    const offenders = new Set();

    for (const file of listFrontendFiles(targetRoot, frontendRoots)) {
        const root = frontendRoots.find((frontendRoot) =>
            file.startsWith(`${frontendRoot.replace(/\/$/, '')}/`),
        );
        const segments = file
            .slice((root ?? '').length)
            .split('/')
            .filter(Boolean);

        segments.forEach((segment, index) => {
            if (!KEBAB_CASE_NAME.test(segment)) {
                offenders.add(
                    path.posix.join(
                        root ?? '',
                        ...segments.slice(0, index + 1),
                    ),
                );
            }
        });
    }

    return [...offenders];
}

/**
 * Runtime Composer requirements must be represented by name in the package's
 * dependency register; the rationale itself remains a human review.
 * @param {string} targetRoot
 * @returns {string[]} Errors, empty when every runtime requirement is listed
 */
export function findDependencyRegisterViolations(targetRoot) {
    const composerPath = path.join(targetRoot, 'composer.json');

    if (!fs.existsSync(composerPath)) {
        return ['composer.json is missing (required for a Composer package).'];
    }

    const composer = JSON.parse(fs.readFileSync(composerPath, 'utf8'));

    if (
        typeof composer !== 'object' ||
        composer === null ||
        Array.isArray(composer)
    ) {
        return ['composer.json must contain a JSON object.'];
    }

    const requirements = composer.require ?? {};

    if (
        typeof requirements !== 'object' ||
        requirements === null ||
        Array.isArray(requirements)
    ) {
        return ['composer.json "require" must be an object.'];
    }

    const registerPath = path.join(targetRoot, 'docs/dependencies.md');

    if (!fs.existsSync(registerPath)) {
        return [];
    }

    const registerLines = normalize(
        fs.readFileSync(registerPath, 'utf8'),
    ).split('\n');
    const documentedDependencies = new Set();
    let hasDependencyTable = false;
    let isDependencyTable = false;

    for (const registerLine of registerLines) {
        const isTableRow = registerLine.trim().startsWith('|');

        if (!isTableRow) {
            isDependencyTable = false;
            continue;
        }

        const cells = registerLine
            .trim()
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((cell) => cell.trim());

        if (cells[0] === 'Dependency') {
            isDependencyTable = true;
            hasDependencyTable = true;
            continue;
        }

        if (
            isDependencyTable &&
            cells[0] !== undefined &&
            !/^:?-{3,}:?$/.test(cells[0])
        ) {
            const dependencyName = cells[0].replace(/^`|`$/g, '').trim();

            if (dependencyName !== '') {
                documentedDependencies.add(dependencyName);
            }
        }
    }

    if (!hasDependencyTable) {
        return [
            'docs/dependencies.md must contain a Markdown table with "Dependency" as its first column.',
        ];
    }

    return Object.keys(requirements)
        .filter((dependencyName) => !documentedDependencies.has(dependencyName))
        .map(
            (dependencyName) =>
                `"${dependencyName}" in composer.json "require" is missing from docs/dependencies.md.`,
        );
}

/**
 * The synced, never hand-edited files of the erasure suite, as repo paths.
 *
 * @returns {string[]}
 */
function managedErasurePaths() {
    const erasureRoot = path.join(standardsRoot, 'php/erasure');

    return listFilesRecursive(erasureRoot)
        .map((absolutePath) =>
            path.relative(erasureRoot, absolutePath).split(path.sep).join('/'),
        )
        .filter((relativePath) => relativePath !== 'fixture.php')
        .map((relativePath) => `tests/Erasure/${relativePath}`);
}

/**
 * Whether CHANGELOG.md has a stable `## [X.Y.Z]` section with X >= 1: the repo
 * has released 1.0, or its release PR is preparing it. The changelog, not the
 * tags, because CI checks out without tags.
 *
 * @param {string} targetRoot
 * @returns {boolean}
 */
function hasStableMajorRelease(targetRoot) {
    const changelogPath = path.join(targetRoot, 'CHANGELOG.md');

    if (!fs.existsSync(changelogPath)) {
        return false;
    }

    return /^## \[v?[1-9]\d*\.\d+\.\d+\]/m.test(
        fs.readFileSync(changelogPath, 'utf8'),
    );
}

/**
 * @param {string} targetRoot
 * @param {{ isCheck: boolean, catalogue?: PatternCatalogue, warnings?: string[] }} options - `warnings` collects non-blocking findings in check mode
 * @returns {string[]} Errors (check mode) or written paths (sync mode)
 * @throws {Error} In sync mode, when `patterns` names an unknown pattern or variant
 */
export function syncStandards(
    targetRoot,
    { isCheck, catalogue = readPatternCatalogue(), warnings = [] },
) {
    const configPath = path.join(targetRoot, CONFIG_FILE);

    if (!fs.existsSync(configPath)) {
        throw new Error(`${CONFIG_FILE} is missing in ${targetRoot}.`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // A warning while packages turn the erasure suite on one by one, and an
    // error from 1.0 on: the 1.0 release PR cannot pass without the decision,
    // and an exemption (`"erasure": false`) only counts with its reason written down.
    const hasErasureExemptReason =
        typeof config.erasureExemptReason === 'string' &&
        config.erasureExemptReason.trim() !== '';
    const erasureDecisionMessage =
        !isCheck || config.package !== true
            ? null
            : typeof config.erasure !== 'boolean'
              ? `erasure: this package has not opted in yet. Set "erasure": true in ${CONFIG_FILE} in the PR that adds its eraser, or "erasure": false with an "erasureExemptReason" if it holds no personal data (.qiick/standards/erasure.md).`
              : config.erasure === false && !hasErasureExemptReason
                ? `erasure: "erasure": false needs an "erasureExemptReason" in ${CONFIG_FILE} that says why the package holds no personal data (.qiick/standards/erasure.md).`
                : null;
    const isErasureDecisionRequired =
        erasureDecisionMessage !== null && hasStableMajorRelease(targetRoot);

    if (erasureDecisionMessage !== null && !isErasureDecisionRequired) {
        warnings.push(erasureDecisionMessage);
    }

    const patternErrors = validatePatterns(config, catalogue);

    if (patternErrors.length > 0) {
        if (!isCheck) {
            throw new Error(patternErrors.join('\n'));
        }

        return patternErrors;
    }

    /** @type {string[]} */
    const messages = isErasureDecisionRequired
        ? [`${erasureDecisionMessage} Required from 1.0.0 on.`]
        : [];

    for (const output of renderOutputs(config, catalogue)) {
        const absolutePath = path.join(targetRoot, output.path);
        const hasFile = fs.existsSync(absolutePath);
        const existing = hasFile
            ? normalize(fs.readFileSync(absolutePath, 'utf8'))
            : '';

        if (output.kind === 'template') {
            if (!hasFile && !isCheck) {
                fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
                fs.writeFileSync(absolutePath, output.content);
                messages.push(output.path);
            }

            if (!hasFile && isCheck) {
                messages.push(`${output.path} is missing.`);
            }

            continue;
        }

        if (isCheck) {
            if (!hasFile) {
                messages.push(`${output.path} is missing.`);
                continue;
            }

            if (output.kind === 'file' && existing !== output.content) {
                messages.push(`${output.path} differs from the standards.`);
            }

            if (output.kind === 'block') {
                const range = findBlock(existing);

                if (!range) {
                    messages.push(
                        `${output.path} has no qiick-standards block.`,
                    );
                } else if (
                    existing.slice(range.start, range.end) !== output.content
                ) {
                    messages.push(
                        `${output.path}: the qiick-standards block differs from the standards (edit outside the block only).`,
                    );
                }
            }

            continue;
        }

        const content =
            output.kind === 'block'
                ? withBlock(existing, output.content)
                : output.content;

        if (content !== existing) {
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
            fs.writeFileSync(absolutePath, content);
            messages.push(output.path);
        }
    }

    // A package that opts out loses the managed erasure suite; its own
    // fixture.php stays, since Pest runs only *Test.php files.
    if (config.erasure !== true) {
        for (const managedPath of managedErasurePaths()) {
            const absolutePath = path.join(targetRoot, managedPath);

            if (!fs.existsSync(absolutePath)) {
                continue;
            }

            if (isCheck) {
                messages.push(
                    `${managedPath} belongs to the erasure suite, which this repo has not opted in to.`,
                );
            } else {
                fs.rmSync(absolutePath);
                messages.push(managedPath);
            }
        }

        const supportDirectory = path.join(targetRoot, 'tests/Erasure/Support');

        if (
            !isCheck &&
            fs.existsSync(supportDirectory) &&
            fs.readdirSync(supportDirectory).length === 0
        ) {
            fs.rmdirSync(supportDirectory);
        }
    }

    if (isCheck) {
        if (config.package) {
            messages.push(...findDependencyRegisterViolations(targetRoot));
        }

        for (const name of findNonKebabCaseNames(
            targetRoot,
            config.frontendRoots ?? [],
        )) {
            messages.push(
                `${name} is not kebab-case (frontend files and directories are kebab-case on disk).`,
            );
        }

        messages.push(...findGraphifyGitViolations(targetRoot));

        if (config.package === true) {
            messages.push(...findPackageMatrixViolations(targetRoot));
        }

        messages.push(...findConventionViolations(targetRoot, config));
    }

    return messages;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const targetFlag = process.argv.indexOf('--target');
    const targetRoot = path.resolve(
        targetFlag === -1 ? process.cwd() : process.argv[targetFlag + 1],
    );
    const isCheck = process.argv.includes('--check');
    /** @type {string[]} */
    const warnings = [];
    const messages = syncStandards(targetRoot, { isCheck, warnings });

    for (const warning of warnings) {
        // GitHub Actions shows `::warning::` lines as annotations on the run.
        console.warn(
            process.env.GITHUB_ACTIONS === 'true'
                ? `::warning::${warning}`
                : `warning: ${warning}`,
        );
    }

    if (isCheck && messages.length > 0) {
        console.error(`check-standards:\n\n${messages.join('\n')}`);
        console.error(
            '\nRun the sync from an app-ui checkout at the ref in qiick-standards.json:\n    node <app-ui>/scripts/sync-standards.mjs --target .\nRepo-specific rules go outside the managed blocks, in tests/Arch/naming-architecture.php, or in their own files.',
        );
        process.exit(1);
    }

    console.log(
        isCheck
            ? 'check-standards: ok'
            : messages.length > 0
              ? `sync-standards: wrote ${messages.join(', ')}`
              : 'sync-standards: up to date',
    );
}
