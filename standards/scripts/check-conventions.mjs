#!/usr/bin/env node
/**
 * Static checks of the qiick fleet conventions (`standards/rules/conventions.md`,
 * decision of 2026-11-24). Node 20+, no dependencies.
 *
 *     node check-conventions.mjs [--target <repo root>]
 *
 * A repo adopts the checks by adding a `conventions` object to
 * `qiick-standards.json`; until then nothing runs, so a repo that has not
 * aligned yet stays green. `scripts/sync-standards.mjs --check` calls it.
 *
 *     "conventions": {
 *         "divergences": {
 *             "F5": { "reason": "…", "decision": "knowledge/decisions/…", "review_by": "YYYY-MM-DD" }
 *         }
 *     }
 *
 * Each check reads source text, so it proves the shape and not the behaviour:
 * the behaviour of a convention is proved by the repo's own tests or the fleet
 * conformance suite, as the rule page says per convention. A divergence skips
 * its check; it must carry a reason, a decision and a review date that has not
 * passed, and it fails once the check would pass without it (stale).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const standardsRoot = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);

/** Every convention id the decision numbers, automated or not. */
export const CONVENTION_IDS = Array.from(
    { length: 18 },
    (_unused, index) => `F${index + 1}`,
);

/** Static properties a framework or library reads as configuration, never written at runtime. */
const FRAMEWORK_STATIC_PROPERTIES = new Set(['$wrap', '$objectClasses']);
/** Words in a command name or class name that mean the command deletes data. */
const DELETING_COMMAND = /prune|purge|delete|cleanup|clean-up|erase|forget/i;
/** Commands that remove expired data on a schedule (F9). */
const RETENTION_COMMAND = /prune|purge/i;
/** Columns holding an instant in the future: `dateTime`, never MySQL `TIMESTAMP` (2038, session time zone). */
const FUTURE_INSTANT_COLUMN =
    /^(?:expires_at|.+_expires_at|.+_until|next_.+_at|scheduled_(?:for|at)|due_at)$/;
/** Log context keys that carry personal data or secrets (F10). */
const FORBIDDEN_LOG_KEYS = new Set([
    'access_token',
    'api_key',
    'authorization',
    'client_secret',
    'cookie',
    'email',
    'id_token',
    'ip',
    'ip_address',
    'password',
    'phone',
    'plaintext',
    'refresh_token',
    'secret',
    'token',
    'user_agent',
]);
/** Spellings of the standard log keys that drift (F10): wrong spelling => standard key. */
const NON_STANDARD_LOG_KEYS = {
    requestid: 'request_id',
    req_id: 'request_id',
    x_request_id: 'request_id',
    organization_id: 'organisation_id',
    org_id: 'organisation_id',
    tenant_id: 'organisation_id',
    publicid: 'public_id',
    uuid: 'public_id',
};
const SNAKE_CASE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @typedef {{ id: string, title: string, appliesTo: ('package' | 'app')[], run: (repo: RepoSnapshot) => string[] }} ConventionCheck
 * @typedef {{
 *     root: string,
 *     kind: 'package' | 'app',
 *     repoName: string,
 *     shortName: string,
 *     sourceFiles: { path: string, text: string }[],
 *     testFiles: { path: string, text: string }[],
 *     migrationFiles: { path: string, text: string }[],
 *     configFiles: { path: string, text: string }[],
 *     scheduleFiles: { path: string, text: string }[],
 * }} RepoSnapshot
 */

/**
 * @param {string} directory
 * @param {RegExp} namePattern
 * @returns {string[]} Absolute paths, sorted
 */
function listFiles(directory, namePattern) {
    if (!fs.existsSync(directory)) {
        return [];
    }

    /** @type {string[]} */
    const found = [];

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory() && entry.name !== 'vendor') {
            found.push(...listFiles(entryPath, namePattern));
        } else if (entry.isFile() && namePattern.test(entry.name)) {
            found.push(entryPath);
        }
    }

    return found.sort();
}

/**
 * PHP without comments, so a docblock example never counts as code. Strings
 * are left alone; `//` inside a URL string survives because only `//` at the
 * start of a line's code or after whitespace starts a comment here.
 * @param {string} text
 */
export function stripPhpComments(text) {
    return text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|\s)(?:\/\/|#(?!\[)).*$/gm, '$1');
}

/**
 * @param {string} root
 * @param {string[]} relativeDirectories
 * @param {string} rootForNames
 */
function readPhpFiles(root, relativeDirectories, rootForNames) {
    return relativeDirectories.flatMap((relativeDirectory) =>
        listFiles(path.join(root, relativeDirectory), /\.php$/).map(
            (absolutePath) => ({
                path: path.relative(rootForNames, absolutePath),
                text: stripPhpComments(fs.readFileSync(absolutePath, 'utf8')),
            }),
        ),
    );
}

/**
 * The repo as the checks see it.
 * @param {string} targetRoot
 * @param {{ package?: boolean, app?: boolean }} config
 * @returns {RepoSnapshot}
 */
export function readRepo(targetRoot, config) {
    const composerPath = path.join(targetRoot, 'composer.json');
    const composerName = fs.existsSync(composerPath)
        ? String(JSON.parse(fs.readFileSync(composerPath, 'utf8')).name ?? '')
        : '';
    const repoName = composerName.split('/').pop() ?? '';
    const kind = config.package === true ? 'package' : 'app';
    // qiick/laravel-http-basics => http-basics; qiick/externa-core => externa.
    const shortName =
        kind === 'package'
            ? repoName.replace(/^laravel-/, '')
            : repoName.replace(/-(?:core|app)$/, '');
    const sourceDirectory = kind === 'package' ? 'src' : 'app';

    return {
        root: targetRoot,
        kind,
        repoName,
        shortName,
        sourceFiles: readPhpFiles(targetRoot, [sourceDirectory], targetRoot),
        testFiles: readPhpFiles(targetRoot, ['tests'], targetRoot),
        migrationFiles: readPhpFiles(
            targetRoot,
            ['database/migrations'],
            targetRoot,
        ),
        configFiles: readPhpFiles(targetRoot, ['config'], targetRoot),
        // An app schedules in routes/console.php or bootstrap/app.php.
        scheduleFiles: ['routes/console.php', 'bootstrap/app.php']
            .map((relativePath) => path.join(targetRoot, relativePath))
            .filter((absolutePath) => fs.existsSync(absolutePath))
            .map((absolutePath) => ({
                path: path.relative(targetRoot, absolutePath),
                text: stripPhpComments(fs.readFileSync(absolutePath, 'utf8')),
            })),
    };
}

/**
 * The text between the parenthesis at `openIndex` and its partner.
 * @param {string} text
 * @param {number} openIndex - Index of `(`
 */
function balancedArguments(text, openIndex) {
    let depth = 0;

    for (let index = openIndex; index < text.length; index++) {
        if (text[index] === '(') {
            depth++;
        } else if (text[index] === ')') {
            depth--;

            if (depth === 0) {
                return text.slice(openIndex + 1, index);
            }
        }
    }

    return text.slice(openIndex + 1);
}

/**
 * Number of top-level arguments in an argument list (`'a', ['b', 'c']` => 2).
 * @param {string} argumentText
 */
function countArguments(argumentText) {
    if (argumentText.trim() === '') {
        return 0;
    }

    let depth = 0;
    let count = 1;

    for (const character of argumentText) {
        if ('([{'.includes(character)) {
            depth++;
        } else if (')]}'.includes(character)) {
            depth--;
        } else if (character === ',' && depth === 0) {
            count++;
        }
    }

    // A trailing comma does not add an argument.
    return /,\s*$/.test(argumentText) ? count - 1 : count;
}

/** PostgreSQL's identifier limit (MySQL's is 64): a longer generated name is silently cut. */
const MAX_INDEX_NAME_LENGTH = 63;

/**
 * The names Laravel generates for indexes declared without one, on tables
 * named by a literal (`Schema::create('table', …)`); a configurable table name
 * is skipped, since its length is only known at install time.
 * @param {string} migrationText
 * @returns {string[]}
 */
export function generatedIndexNames(migrationText) {
    /** @type {string[]} */
    const names = [];
    let tableName = null;

    for (const statement of migrationText.split(';')) {
        const schemaCall = statement.match(
            /Schema::(?:connection\([^)]*\)->)?(?:create|table)\(\s*(?:(['"])(\w+)\1|[^,]+)/,
        );

        if (schemaCall) {
            tableName = schemaCall[2] ?? null;
        }

        if (tableName === null) {
            continue;
        }

        for (const match of statement.matchAll(
            /->(index|unique|fullText|spatialIndex)\(/g,
        )) {
            const argumentText = balancedArguments(
                statement,
                (match.index ?? 0) + match[0].length - 1,
            );

            if (countArguments(argumentText) >= 2) {
                continue;
            }

            // `->unique()` as a column modifier indexes the column the chain defines.
            const columns =
                argumentText.trim() === ''
                    ? [statement.match(/\$table->\w+\(\s*['"](\w+)['"]/)?.[1]]
                    : [...argumentText.matchAll(/['"](\w+)['"]/g)].map(
                          (columnMatch) => columnMatch[1],
                      );

            if (columns.length === 0 || columns.includes(undefined)) {
                continue;
            }

            names.push(
                `${tableName}_${columns.join('_')}_${match[1].toLowerCase()}`,
            );
        }
    }

    return names;
}

/**
 * Artisan commands declared in the source: name, options text and file.
 * @param {RepoSnapshot} repo
 */
export function findCommands(repo) {
    /** @type {{ name: string, signature: string, file: string, text: string }[]} */
    const commands = [];

    for (const file of repo.sourceFiles) {
        const signature =
            file.text.match(/\$signature\s*=\s*(['"])([\s\S]*?)\1\s*;/)?.[2] ??
            // Symfony's #[AsCommand(name: …)] and Laravel 13's #[Signature('…')].
            file.text.match(
                /#\[(?:AsCommand\(\s*name:\s*|Signature\(\s*)(['"])([\s\S]+?)\1/,
            )?.[2];

        if (signature) {
            commands.push({
                name: signature.trim().split(/\s+/)[0],
                signature,
                file: file.path,
                text: file.text,
            });
        }
    }

    return commands;
}

/** @type {ConventionCheck[]} */
export const CONVENTION_CHECKS = [
    {
        id: 'F1',
        title: 'published config named after the package',
        appliesTo: ['package'],
        run: (repo) =>
            fs.existsSync(path.join(repo.root, `config/${repo.shortName}.php`))
                ? []
                : [`config/${repo.shortName}.php is missing.`],
    },
    {
        id: 'F2',
        title: '`<package>:check` command',
        appliesTo: ['package'],
        run: (repo) =>
            findCommands(repo).some(
                (command) => command.name === `${repo.shortName}:check`,
            )
                ? []
                : [
                      `no \`${repo.shortName}:check\` command (validates the config and the environment for a deploy).`,
                  ],
    },
    {
        id: 'F3',
        title: 'a disabled feature is tested',
        appliesTo: ['package'],
        run: (repo) => {
            const config = repo.configFiles.find(
                (file) => file.path === `config/${repo.shortName}.php`,
            );

            if (!config || !/['"]enabled['"]\s*=>/.test(config.text)) {
                return [];
            }

            const hasDisabledTest = repo.testFiles.some((file) =>
                /enabled['"]\s*(?:=>|,)\s*false/.test(file.text),
            );

            return hasDisabledTest
                ? []
                : [
                      `config/${repo.shortName}.php has an \`enabled\` switch but no test sets one to false (prove that a disabled feature registers no route, listener or binding).`,
                  ];
        },
    },
    {
        id: 'F4',
        title: 'no static state',
        appliesTo: ['package', 'app'],
        run: (repo) =>
            repo.sourceFiles
                .filter((file) => !file.path.includes('/Testing/'))
                .flatMap((file) =>
                    [
                        ...file.text.matchAll(
                            /\b(?:(?:private|protected|public)\s+)?static\s+(?!function\b|fn\b|readonly\b)(?:\??[\w\\|]+\s+)?(\$\w+)/gm,
                        ),
                    ]
                        .map((match) => match[1])
                        .filter(
                            (variableName) =>
                                !FRAMEWORK_STATIC_PROPERTIES.has(variableName),
                        )
                        .map(
                            (variableName) =>
                                `${file.path}: static property or variable ${variableName} keeps state across requests and jobs under Octane and long-running workers.`,
                        ),
                ),
    },
    {
        id: 'F5',
        title: 'event classes end with `Event`',
        appliesTo: ['package', 'app'],
        run: (repo) =>
            repo.sourceFiles
                .filter(
                    (file) =>
                        /(^|\/)Events\/[^/]+\.php$/.test(file.path) &&
                        /\bclass\s+\w/.test(file.text),
                )
                .filter((file) => !/Event\.php$/.test(file.path))
                .map(
                    (file) =>
                        `${file.path}: event class name does not end with \`Event\`.`,
                ),
    },
    {
        id: 'F6',
        title: '`<name>:<verb>` commands, `--dry-run` on deleting commands',
        appliesTo: ['package', 'app'],
        run: (repo) => {
            const namePattern = new RegExp(
                `^${repo.shortName}:[a-z0-9]+(?:-[a-z0-9]+)*$`,
            );

            return findCommands(repo).flatMap((command) => [
                ...(namePattern.test(command.name)
                    ? []
                    : [
                          `${command.file}: command \`${command.name}\` is not \`${repo.shortName}:<verb>\` (one namespace, kebab-case verb).`,
                      ]),
                ...(DELETING_COMMAND.test(command.name) &&
                !/\{\s*--dry-run|['"]dry-run['"]/.test(command.text)
                    ? [
                          `${command.file}: command \`${command.name}\` deletes data without a \`--dry-run\` option.`,
                      ]
                    : []),
            ]);
        },
    },
    {
        id: 'F7',
        title: 'environment variables carry the package prefix',
        appliesTo: ['package'],
        run: (repo) => {
            const prefix = `${repo.shortName.toUpperCase().replace(/-/g, '_')}_`;

            return repo.configFiles.flatMap((file) =>
                [...file.text.matchAll(/env\(\s*['"]([A-Z0-9_]+)['"]/g)]
                    .map((match) => match[1])
                    // The framework's own variables may be read as a fallback.
                    .filter(
                        (name) =>
                            !name.startsWith(prefix) &&
                            !name.startsWith('APP_'),
                    )
                    .map(
                        (name) =>
                            `${file.path}: env('${name}') does not start with ${prefix}.`,
                    ),
            );
        },
    },
    {
        id: 'F8',
        title: 'standard columns and stable index names',
        appliesTo: ['package', 'app'],
        run: (repo) =>
            repo.migrationFiles.flatMap((file) => {
                /** @type {string[]} */
                const errors = [];

                for (const indexName of generatedIndexNames(file.text)) {
                    if (indexName.length > MAX_INDEX_NAME_LENGTH) {
                        errors.push(
                            `${file.path}: generated index name \`${indexName}\` is ${indexName.length} characters; PostgreSQL truncates past ${MAX_INDEX_NAME_LENGTH} and MySQL refuses past 64: pass an explicit name.`,
                        );
                    }
                }

                for (const match of file.text.matchAll(
                    /->(\w+)\(\s*['"](organi[sz]ation_id|public_id)['"]/g,
                )) {
                    const [, method, column] = match;

                    if (column === 'organization_id') {
                        errors.push(
                            `${file.path}: \`organization_id\` is spelled \`organisation_id\` in the fleet.`,
                        );
                    } else if (
                        !/^(?:uuid|foreignUuid|dropColumn|index|unique)$/.test(
                            method,
                        )
                    ) {
                        errors.push(
                            `${file.path}: \`${column}\` is ->${method}(), not a UUID column.`,
                        );
                    }
                }

                for (const match of file.text.matchAll(
                    /->(timestamp|timestampTz)\(\s*['"](\w+)['"]/g,
                )) {
                    if (FUTURE_INSTANT_COLUMN.test(match[2])) {
                        errors.push(
                            `${file.path}: \`${match[2]}\` holds a future instant: ->dateTime(), not ->${match[1]}().`,
                        );
                    }
                }

                for (const match of file.text.matchAll(
                    /->jsonb?\(\s*['"](meta|meta_data|extra|extras|extra_data)['"]/g,
                )) {
                    errors.push(
                        `${file.path}: the free-form JSON column is \`metadata\`, not \`${match[1]}\`.`,
                    );
                }

                return errors;
            }),
    },
    {
        id: 'F9',
        title: 'retention commands: chunked, dry run, scheduled daily on one server',
        appliesTo: ['package', 'app'],
        run: (repo) => {
            const scheduleStatements = [
                ...repo.sourceFiles,
                ...repo.scheduleFiles,
            ].flatMap((file) =>
                file.text
                    .split(';')
                    .filter((statement) => /->onOneServer\(\)/.test(statement)),
            );

            return findCommands(repo)
                .filter((command) => RETENTION_COMMAND.test(command.name))
                .flatMap((command) => [
                    ...(/chunkById|lazyById|->chunk\(|->limit\(|->take\(/.test(
                        command.text,
                    )
                        ? []
                        : [
                              `${command.file}: \`${command.name}\` deletes in one statement; delete in chunks (chunkById / limit) so a large backlog never locks the table.`,
                          ]),
                    ...(scheduleStatements.some(
                        (statement) =>
                            statement.includes(`'${command.name}`) ||
                            statement.includes(
                                `${path.basename(command.file, '.php')}::class`,
                            ),
                    )
                        ? []
                        : [
                              `${command.file}: \`${command.name}\` is not scheduled ->onOneServer() (at least daily) by the ${repo.kind === 'package' ? 'service provider' : 'app'}.`,
                          ]),
                ]);
        },
    },
    {
        id: 'F10',
        title: 'structured log keys, no personal data or secrets',
        appliesTo: ['package', 'app'],
        run: (repo) =>
            repo.sourceFiles.flatMap((file) => {
                /** @type {string[]} */
                const errors = [];

                for (const match of file.text.matchAll(
                    /(?:Log::|logger\(\)->|\$(?:this->)?logger->)(?:debug|info|notice|warning|error|critical|alert|emergency|log|withContext|shareContext)\(/g,
                )) {
                    const callText = balancedArguments(
                        file.text,
                        (match.index ?? 0) + match[0].length - 1,
                    );

                    for (const keyMatch of callText.matchAll(
                        /['"]([A-Za-z_][\w.-]*)['"]\s*=>/g,
                    )) {
                        const key = keyMatch[1];
                        const standardKey =
                            NON_STANDARD_LOG_KEYS[key.toLowerCase()];

                        if (FORBIDDEN_LOG_KEYS.has(key.toLowerCase())) {
                            errors.push(
                                `${file.path}: log context key \`${key}\` carries personal data or a secret.`,
                            );
                        } else if (standardKey) {
                            errors.push(
                                `${file.path}: log context key \`${key}\` is \`${standardKey}\` in the fleet.`,
                            );
                        } else if (!SNAKE_CASE.test(key)) {
                            errors.push(
                                `${file.path}: log context key \`${key}\` is not snake_case.`,
                            );
                        }
                    }
                }

                return errors;
            }),
    },
    {
        id: 'F11',
        title: 'error codes registered in the fleet registry',
        appliesTo: ['package', 'app'],
        run: (repo) => findErrorCodeViolations(repo, readErrorCodeRegistry()),
    },
    {
        id: 'F14',
        title: 'test fakes live in the `Testing` namespace',
        appliesTo: ['package'],
        run: (repo) => {
            const misplaced = repo.sourceFiles
                .filter(
                    (file) =>
                        !file.path.includes('/Testing/') &&
                        /^(?:Fake|InMemory)[A-Z]\w*\.php$/.test(
                            path.basename(file.path),
                        ),
                )
                .map(
                    (file) =>
                        `${file.path}: a test fake belongs in src/Testing/.`,
                );
            const hasContracts = repo.sourceFiles.some((file) =>
                file.path.startsWith('src/Contracts/'),
            );
            const hasTesting = repo.sourceFiles.some((file) =>
                file.path.startsWith('src/Testing/'),
            );

            return [
                ...misplaced,
                ...(hasContracts && !hasTesting
                    ? [
                          'src/Contracts/ has interfaces but src/Testing/ has no fakes for products to test with.',
                      ]
                    : []),
            ];
        },
    },
    {
        id: 'F12',
        title: 'the same files in every package',
        appliesTo: ['package'],
        run: (repo) => findPackageFileViolations(repo.root, repo.testFiles),
    },
    {
        id: 'F13',
        title: 'a 1.0 never depends on a 0.x or pre-release qiick package',
        appliesTo: ['package', 'app'],
        run: (repo) => findReleaseOrderViolations(repo.root),
    },
    {
        id: 'F15',
        title: 'actions and reusable workflows pinned by commit SHA',
        appliesTo: ['package', 'app'],
        run: (repo) => findUnpinnedWorkflowReferences(repo.root),
    },
    {
        id: 'F18',
        title: 'the same product structure',
        appliesTo: ['app'],
        run: (repo) => findProductStructureViolations(repo),
    },
];

/**
 * @param {string} root
 * @param {string} relativePath
 * @returns {string | null} The file's text, or null when it does not exist
 */
function readText(root, relativePath) {
    const absolutePath = path.join(root, relativePath);
    const directory = path.dirname(absolutePath);

    // Compared by exact name: macOS would open PUBLIC-API.md for public-api.md, Linux CI would not.
    return fs.existsSync(directory) &&
        fs.readdirSync(directory).includes(path.basename(absolutePath))
        ? fs.readFileSync(absolutePath, 'utf8')
        : null;
}

/**
 * Released versions in a Keep a Changelog file, newest first (`[Unreleased]` excluded).
 * @param {string} changelogText
 */
export function releasedVersions(changelogText) {
    return [...changelogText.matchAll(/^## \[(\d+\.\d+\.\d+[^\]]*)\]/gm)].map(
        (match) => match[1],
    );
}

/**
 * F12: public API page with its test, deprecation policy, security checklist
 * mapped to tests, dated decisions, UPGRADING per version, CHANGELOG with
 * compare links. The dependency register (`docs/dependencies.md`) has its own
 * check in the standards drift (`"package": true`).
 * @param {string} root
 * @param {{ path: string, text: string }[]} testFiles
 */
export function findPackageFileViolations(root, testFiles) {
    /** @type {string[]} */
    const errors = [];
    const publicApi = readText(root, 'docs/public-api.md');

    if (publicApi === null) {
        errors.push('docs/public-api.md is missing.');
    } else if (!/^#+ Deprecation policy$/m.test(publicApi)) {
        errors.push('docs/public-api.md has no "Deprecation policy" section.');
    }

    if (!testFiles.some((file) => file.text.includes('public-api.md'))) {
        errors.push(
            'no test reads docs/public-api.md (tests/Arch/PublicApiTest.php: every @api class is listed).',
        );
    }

    const securityChecklist = readText(root, 'docs/security-checklist.md');

    if (securityChecklist === null) {
        errors.push('docs/security-checklist.md is missing.');
    } else if (!/^\|.*Covering test.*\|$/m.test(securityChecklist)) {
        errors.push(
            'docs/security-checklist.md has no table with a "Covering test" column.',
        );
    }

    const decisionsDirectory = path.join(root, 'docs/decisions');
    const decisionFiles = fs.existsSync(decisionsDirectory)
        ? fs
              .readdirSync(decisionsDirectory)
              .filter((name) => name.endsWith('.md'))
        : [];

    if (decisionFiles.length === 0) {
        errors.push('docs/decisions/ has no decision.');
    }

    for (const name of decisionFiles) {
        const date = name.match(
            /^(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/,
        )?.[1];
        const heading =
            readText(root, `docs/decisions/${name}`)?.match(/^# (.+)$/m)?.[1] ??
            '';

        if (!date) {
            errors.push(
                `docs/decisions/${name} is not named YYYY-MM-DD-<kebab-slug>.md.`,
            );
        } else if (!heading.startsWith(`${date}: `)) {
            errors.push(
                `docs/decisions/${name}: the title is not "# ${date}: <title>".`,
            );
        }
    }

    const changelog = readText(root, 'CHANGELOG.md');
    const upgrading = readText(root, 'UPGRADING.md');

    if (changelog === null) {
        errors.push('CHANGELOG.md is missing.');
    } else {
        if (!/^## \[Unreleased\]/m.test(changelog)) {
            errors.push('CHANGELOG.md has no [Unreleased] section.');
        }

        for (const version of releasedVersions(changelog)) {
            if (!changelog.includes(`[${version}]: http`)) {
                errors.push(`CHANGELOG.md: [${version}] has no compare link.`);
            }

            if (upgrading !== null && !upgrading.includes(version)) {
                errors.push(`UPGRADING.md has no section for ${version}.`);
            }
        }
    }

    if (upgrading === null) {
        errors.push('UPGRADING.md is missing.');
    }

    return errors;
}

/**
 * F13: once a repo's own version line is 1.x (a pre-release included), its
 * qiick dependencies are 1.x too; once it is stable, they are stable.
 * @param {string} root
 */
export function findReleaseOrderViolations(root) {
    const composerText = readText(root, 'composer.json');
    const ownVersion = releasedVersions(
        readText(root, 'CHANGELOG.md') ?? '',
    )[0];

    if (composerText === null || ownVersion === undefined) {
        return [];
    }

    const isOneZeroLine = Number(ownVersion.split('.')[0]) >= 1;
    const isStable = !ownVersion.includes('-');
    const qiickRequirements = Object.entries(
        JSON.parse(composerText).require ?? {},
    ).filter(([name]) => name.startsWith('qiick/'));

    return qiickRequirements.flatMap(([name, constraint]) => [
        ...(isOneZeroLine && /(?:^|[|\s,])[\^~]?0\.|^0\./.test(constraint)
            ? [
                  `composer.json: ${ownVersion} requires ${name} ${constraint}, a 0.x line; ${name} releases 1.0 first.`,
              ]
            : []),
        ...(isStable && /@(?:alpha|beta|RC|dev)|dev-/i.test(constraint)
            ? [
                  `composer.json: stable ${ownVersion} requires ${name} ${constraint}, a pre-release.`,
              ]
            : []),
    ]);
}

/**
 * F15: every `uses:` in the repo's workflows is a local path, a Docker image
 * or pinned by a full commit SHA.
 * @param {string} root
 */
export function findUnpinnedWorkflowReferences(root) {
    return listFiles(path.join(root, '.github/workflows'), /\.ya?ml$/).flatMap(
        (absolutePath) =>
            [
                ...fs
                    .readFileSync(absolutePath, 'utf8')
                    .matchAll(/^\s*(?:-\s*)?uses:\s*['"]?([^\s'"#]+)/gm),
            ]
                .map((match) => match[1])
                .filter(
                    (reference) =>
                        !reference.startsWith('./') &&
                        !reference.startsWith('docker://') &&
                        !/@[0-9a-f]{40}$/.test(reference),
                )
                .map(
                    (reference) =>
                        `${path.relative(root, absolutePath)}: \`${reference}\` is not pinned by commit SHA.`,
                ),
    );
}

/**
 * F18: beta checklist, installer and upgrade commands, local database rules.
 * @param {RepoSnapshot} repo
 */
export function findProductStructureViolations(repo) {
    /** @type {string[]} */
    const errors = [];
    const commandNames = findCommands(repo).map((command) => command.name);

    if (readText(repo.root, 'docs/beta-readiness.md') === null) {
        errors.push(
            'docs/beta-readiness.md is missing (the fleet beta checklist, standards/templates/beta-readiness.md).',
        );
    }

    for (const verb of ['install', 'upgrade']) {
        if (!commandNames.includes(`${repo.shortName}:${verb}`)) {
            errors.push(`no \`${repo.shortName}:${verb}\` command.`);
        }
    }

    const environmentExample = readText(repo.root, '.env.example');
    const databaseName = repo.repoName.replace(/-/g, '_');

    if (environmentExample === null) {
        errors.push('.env.example is missing.');
    } else if (
        !/^DB_CONNECTION=sqlite$/m.test(environmentExample) &&
        !new RegExp(`^DB_DATABASE=${databaseName}$`, 'm').test(
            environmentExample,
        )
    ) {
        errors.push(
            `.env.example: the local database is SQLite or \`${databaseName}\`, the app's one database.`,
        );
    }

    if (
        !/name="DB_DATABASE" value="(?::memory:|[a-z_]+_testing)"/.test(
            readText(repo.root, 'phpunit.xml') ?? '',
        )
    ) {
        errors.push(
            'phpunit.xml does not pin DB_DATABASE to :memory: (or a *_testing database): tests could run against the development database.',
        );
    }

    return errors;
}

/**
 * @typedef {{ code: string, owner: string, description: string, replacedBy?: string }} ErrorCodeEntry
 */

/**
 * The fleet registry of machine error codes (`standards/error-codes.json`).
 * @returns {{ sharedOwners: string[], codes: ErrorCodeEntry[] }}
 */
export function readErrorCodeRegistry() {
    return JSON.parse(
        fs.readFileSync(path.join(standardsRoot, 'error-codes.json'), 'utf8'),
    );
}

/**
 * Registry errors: duplicate or non-snake_case codes, missing fields.
 * @param {{ sharedOwners: string[], codes: ErrorCodeEntry[] }} registry
 */
export function findErrorCodeRegistryErrors(registry) {
    /** @type {string[]} */
    const errors = [];
    const seenCodes = new Set();

    for (const entry of registry.codes) {
        if (seenCodes.has(entry.code)) {
            errors.push(`error code \`${entry.code}\` is registered twice.`);
        }

        seenCodes.add(entry.code);

        if (!SNAKE_CASE.test(entry.code)) {
            errors.push(`error code \`${entry.code}\` is not snake_case.`);
        }

        if (
            typeof entry.owner !== 'string' ||
            entry.owner === '' ||
            typeof entry.description !== 'string' ||
            entry.description === ''
        ) {
            errors.push(
                `error code \`${entry.code}\` needs an owner and a description.`,
            );
        }
    }

    for (const entry of registry.codes) {
        const replacement = registry.codes.find(
            (candidate) => candidate.code === entry.replacedBy,
        );

        if (entry.replacedBy !== undefined && !replacement) {
            errors.push(
                `error code \`${entry.code}\` is replaced by \`${entry.replacedBy}\`, which is not registered.`,
            );
        }
    }

    return errors;
}

/**
 * A repo's `docs/error-codes.md` against the registry: every code it lists is
 * registered, and owned by the repo or a shared owner; every code the registry
 * gives the repo is listed. A repo without the file defines no code.
 * @param {RepoSnapshot} repo
 * @param {{ sharedOwners: string[], codes: ErrorCodeEntry[] }} registry
 */
export function findErrorCodeViolations(repo, registry) {
    const catalogPath = path.join(repo.root, 'docs/error-codes.md');
    const ownedCodes = registry.codes.filter(
        (entry) => entry.owner === repo.repoName,
    );

    if (!fs.existsSync(catalogPath)) {
        return ownedCodes.length === 0
            ? []
            : [
                  `docs/error-codes.md is missing; the registry gives this repo ${ownedCodes.length} code(s).`,
              ];
    }

    const listedCodes = [
        ...fs
            .readFileSync(catalogPath, 'utf8')
            .matchAll(/^\|\s*`([a-z0-9_]+)`\s*\|/gm),
    ].map((match) => match[1]);
    const registryByCode = new Map(
        registry.codes.map((entry) => [entry.code, entry]),
    );

    return [
        ...listedCodes.flatMap((code) => {
            const entry = registryByCode.get(code);

            if (!entry) {
                return [
                    `docs/error-codes.md: \`${code}\` is not in the fleet registry (standards/error-codes.json in app-ui).`,
                ];
            }

            if (entry.replacedBy !== undefined) {
                return [
                    `docs/error-codes.md: \`${code}\` duplicates \`${entry.replacedBy}\`; emit \`${entry.replacedBy}\` instead.`,
                ];
            }

            return entry.owner === repo.repoName ||
                registry.sharedOwners.includes(entry.owner)
                ? []
                : [
                      `docs/error-codes.md: \`${code}\` belongs to ${entry.owner}; reuse it only with the same meaning, or register a code of your own.`,
                  ];
        }),
        ...ownedCodes
            .filter((entry) => !listedCodes.includes(entry.code))
            .map(
                (entry) =>
                    `docs/error-codes.md: \`${entry.code}\` is registered for this repo but not listed.`,
            ),
    ];
}

/**
 * Divergence errors: unknown id, missing metadata, past review date.
 * @param {Record<string, unknown>} divergences
 * @param {string} today - YYYY-MM-DD
 */
export function findDivergenceErrors(divergences, today) {
    return Object.entries(divergences).flatMap(([id, divergence]) => {
        if (!CONVENTION_IDS.includes(id)) {
            return [`conventions.divergences: unknown convention id "${id}".`];
        }

        const isComplete =
            typeof divergence === 'object' &&
            divergence !== null &&
            ['reason', 'decision', 'review_by'].every(
                (field) =>
                    typeof divergence[field] === 'string' &&
                    divergence[field].trim() !== '',
            );

        if (!isComplete) {
            return [
                `conventions.divergences.${id} needs reason, decision and review_by.`,
            ];
        }

        if (!ISO_DATE.test(divergence.review_by)) {
            return [
                `conventions.divergences.${id}.review_by is not YYYY-MM-DD.`,
            ];
        }

        return divergence.review_by < today
            ? [
                  `conventions.divergences.${id} expired on ${divergence.review_by}: align the repo or renew the exception with a new decision.`,
              ]
            : [];
    });
}

/**
 * Every convention error for a repo that adopted the conventions; empty when
 * the repo has no `conventions` object.
 * @param {string} targetRoot
 * @param {{ package?: boolean, app?: boolean, conventions?: { divergences?: Record<string, unknown> } }} config
 * @param {{ today?: string, checks?: ConventionCheck[] }} [options]
 * @returns {string[]}
 */
export function findConventionViolations(
    targetRoot,
    config,
    {
        today = new Date().toISOString().slice(0, 10),
        checks = CONVENTION_CHECKS,
    } = {},
) {
    if (typeof config.conventions !== 'object' || config.conventions === null) {
        return [];
    }

    const divergences = config.conventions.divergences ?? {};
    const repo = readRepo(targetRoot, config);
    /** @type {string[]} */
    const errors = findDivergenceErrors(divergences, today).map(
        (error) => `conventions: ${error}`,
    );

    for (const check of checks) {
        if (!check.appliesTo.includes(repo.kind)) {
            continue;
        }

        const checkErrors = check.run(repo);
        const hasDivergence = Object.hasOwn(divergences, check.id);

        if (hasDivergence && checkErrors.length === 0) {
            errors.push(
                `conventions: ${check.id} (${check.title}) passes; remove its divergence.`,
            );
        }

        if (!hasDivergence) {
            errors.push(
                ...checkErrors.map(
                    (error) =>
                        `conventions ${check.id} (${check.title}): ${error}`,
                ),
            );
        }
    }

    return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const targetFlag = process.argv.indexOf('--target');
    const targetRoot = path.resolve(
        targetFlag === -1 ? process.cwd() : process.argv[targetFlag + 1],
    );
    const config = JSON.parse(
        fs.readFileSync(path.join(targetRoot, 'qiick-standards.json'), 'utf8'),
    );
    // --all runs every check as if the repo had adopted them: the alignment report.
    const errors = findConventionViolations(
        targetRoot,
        process.argv.includes('--all')
            ? {
                  ...config,
                  // A package that has not set `package: true` yet is any repo that is not an app.
                  package: config.package ?? config.app !== true,
                  conventions: config.conventions ?? {},
              }
            : config,
    );

    if (errors.length > 0) {
        console.error(`check-conventions:\n\n${errors.join('\n')}`);
        process.exit(1);
    }

    console.log('check-conventions: ok');
}
