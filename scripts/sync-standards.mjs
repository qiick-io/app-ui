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
 *         "eslint": true,                  // shared ESLint config file
 *         "app": true                      // self-hosted app: stack and distribution rules
 *     }
 *
 * Managed files are of two kinds:
 *
 * - whole files (`.cursor/rules/*.mdc`, the architecture test, …): the repo's
 *   copy must match byte for byte (line endings aside);
 * - blocks inside `AGENTS.md`, `CLAUDE.md` and `.github/copilot-instructions.md`
 *   between the `qiick-standards:begin` / `:end` markers: only the block is
 *   managed; everything outside it (repo rules, Laravel Boost guidelines) is the
 *   repo's own.
 *
 * `--check` fails on a missing or different managed file or block, and on a
 * frontend file or directory name that is not kebab-case.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_FILE = 'qiick-standards.json';
const SOURCE_URL = 'https://github.com/qiick-io/app-ui/tree/develop/standards';
const NEW_PRODUCT_URL =
    'https://github.com/qiick-io/app-ui/blob/develop/docs/new-product.md';
const BLOCK_BEGIN =
    '<!-- qiick-standards:begin. Generated from qiick-io/app-ui standards: do not edit inside this block, run the sync (see qiick-standards.json). -->';
const BLOCK_END = '<!-- qiick-standards:end -->';
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
 * @param {{ uiPreset?: string, app?: boolean }} config
 * @returns {Record<string, string>} Rule page name => Markdown
 */
function renderRulePages(config) {
    /** @type {Record<string, string>} */
    const pages = {
        ...(config.app ? { stack: readSource('rules/stack.md') } : {}),
        code: readSource('rules/code.md'),
        testing: readSource('rules/testing.md'),
        git: readSource('rules/git.md'),
        release: readSource('rules/release.md'),
        checks: readSource('rules/checks.md'),
    };

    if (config.app) {
        pages.distribution = readSource('rules/distribution.md');
    }

    if (config.uiPreset) {
        pages.ui = readSource('rules/ui.md').replace(
            '{{preset}}',
            config.uiPreset,
        );
    }

    return pages;
}

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
 * @param {{ uiPreset?: string, php?: boolean, eslint?: boolean, app?: boolean, frontendRoots?: string[] }} config
 * @returns {{ path: string, kind: 'file' | 'block' | 'template', content: string }[]}
 */
export function renderOutputs(config) {
    const pages = renderRulePages(config);
    const agentsBody = [
        '# qiick standards',
        `These rules bind every agent and contributor in this repo from the first task. They are the same in every qiick repo (source: ${SOURCE_URL}), and CI fails when this block differs from the source. Rules for this repo only live outside this block; where they are more specific, they win. Starting a new qiick product: ${NEW_PRODUCT_URL}.`,
        ...Object.values(pages).map((page) => demoteHeadings(page.trim())),
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
                    pages.checks,
                    pages.git,
                    pages.distribution,
                ]
                    .filter(Boolean)
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
                pages.testing,
            ),
        },
        {
            path: '.cursor/rules/no-auto-release.mdc',
            kind: 'file',
            content: cursorRule(
                'Never release, tag or merge to main without the maintainer',
                'alwaysApply: true',
                pages.release,
            ),
        },
        {
            path: '.cursor/commands/code-comments.md',
            kind: 'file',
            content: readSource('rules/comments.md'),
        },
    ];

    if (pages.ui) {
        outputs.push({
            path: '.cursor/rules/accessibility-and-theme.mdc',
            kind: 'file',
            content: cursorRule(
                'qiick app UI: registry first, theme tokens, WCAG 2.2 AA',
                'globs: "**/*.tsx"\nalwaysApply: false',
                pages.ui,
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
    }

    outputs.push({
        path: 'scripts/qiick-ratchet.mjs',
        kind: 'file',
        content: readSource('scripts/qiick-ratchet.mjs'),
    });

    if ((config.frontendRoots ?? []).length > 0) {
        outputs.push({
            path: 'knip.json',
            kind: 'template',
            content: readSource('templates/knip.json'),
        });
    }

    if (config.eslint) {
        outputs.push({
            path: 'qiick-standards.eslint.js',
            kind: 'file',
            content: readSource('eslint/qiick-standards.eslint.js'),
        });
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
 * @param {string} targetRoot
 * @param {{ isCheck: boolean }} options
 * @returns {string[]} Errors (check mode) or written paths (sync mode)
 */
export function syncStandards(targetRoot, { isCheck }) {
    const configPath = path.join(targetRoot, CONFIG_FILE);

    if (!fs.existsSync(configPath)) {
        throw new Error(`${CONFIG_FILE} is missing in ${targetRoot}.`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    /** @type {string[]} */
    const messages = [];

    for (const output of renderOutputs(config)) {
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

    if (isCheck) {
        for (const name of findNonKebabCaseNames(
            targetRoot,
            config.frontendRoots ?? [],
        )) {
            messages.push(
                `${name} is not kebab-case (frontend files and directories are kebab-case on disk).`,
            );
        }
    }

    return messages;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const targetFlag = process.argv.indexOf('--target');
    const targetRoot = path.resolve(
        targetFlag === -1 ? process.cwd() : process.argv[targetFlag + 1],
    );
    const isCheck = process.argv.includes('--check');
    const messages = syncStandards(targetRoot, { isCheck });

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
