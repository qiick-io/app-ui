#!/usr/bin/env node
/**
 * Read-only scan: overlay the conformance suite onto each product's origin/develop
 * worktree (temporary), migrate on sqlite, and run every check. Prints a failure
 * table for adoption PRs. Does not modify product remotes.
 *
 *     node scripts/conformance-product-scan.mjs \
 *       externa-core=/path/to/externa-core \
 *       excubia-app=/path/to/excubia-app
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const suiteSource = path.join(root, 'standards/php/conformance');

/**
 * @returns {Record<string, string>}
 */
function resolveProducts() {
    /** @type {Record<string, string>} */
    const products = {};
    const fromEnv = process.env.QIICK_PRODUCT_ROOTS ?? '';

    for (const entry of [...fromEnv.split(','), ...process.argv.slice(2)]) {
        const trimmed = entry.trim();

        if (!trimmed.includes('=')) {
            continue;
        }

        const equals = trimmed.indexOf('=');
        const name = trimmed.slice(0, equals);
        const productRoot = trimmed.slice(equals + 1);

        if (name && productRoot) {
            products[name] = path.resolve(productRoot);
        }
    }

    return products;
}

const products = resolveProducts();

if (Object.keys(products).length === 0) {
    console.error('Pass product roots as name=/abs/path args.');
    process.exit(2);
}

const catalog =
    fs
        .readFileSync(path.join(suiteSource, 'catalog.php'), 'utf8')
        .match(/'id'\s*=>\s*'(C\d+)'/g)
        ?.map((match) => match.replace(/.*'(C\d+)'.*/, '$1')) ?? [];

/**
 * @param {string} directory
 */
function removeTree(directory) {
    spawnSync('rm', ['-rf', directory], { stdio: 'ignore' });
}

/**
 * @param {string} productRoot
 * @param {string} workDir
 */
function overlaySuite(productRoot, workDir) {
    execFileSync(
        'git',
        ['worktree', 'add', '--detach', workDir, 'origin/develop'],
        { cwd: productRoot, stdio: 'pipe' },
    );

    const target = path.join(workDir, 'tests/Conformance');
    fs.mkdirSync(target, { recursive: true });
    execFileSync(
        'rsync',
        ['-a', '--exclude', 'hooks.php', `${suiteSource}/`, `${target}/`],
        { stdio: 'pipe' },
    );
    fs.copyFileSync(
        path.join(suiteSource, 'hooks.php'),
        path.join(target, 'hooks.php'),
    );

    const vendorSource = path.join(productRoot, 'vendor');

    if (
        fs.existsSync(path.join(vendorSource, 'autoload.php')) &&
        !fs.existsSync(path.join(workDir, 'vendor'))
    ) {
        fs.symlinkSync(vendorSource, path.join(workDir, 'vendor'), 'dir');
    }
}

/**
 * @param {string} workDir
 * @returns {{ id: string, status: 'pass'|'fail'|'skip', detail: string }[]}
 */
function runChecks(workDir) {
    const runner = path.join(workDir, 'tests/Conformance/_scan.php');
    fs.writeFileSync(
        runner,
        `<?php
declare(strict_types=1);
require __DIR__ . '/../../vendor/autoload.php';
$app = require __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
spl_autoload_register(function (string $class): void {
    $prefix = 'Qiick\\\\Standards\\\\Conformance\\\\';
    if (!str_starts_with($class, $prefix)) return;
    $path = __DIR__ . '/' . str_replace('\\\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($path)) require_once $path;
});
$catalog = require __DIR__ . '/catalog.php';
$hooks = Qiick\\Standards\\Conformance\\Support\\ConformanceHooks::fromBasePath(base_path());
$schema = new Qiick\\Standards\\Conformance\\Support\\SchemaInspector();
$runner = new Qiick\\Standards\\Conformance\\Support\\ConformanceRunner(base_path(), $hooks, $schema);
$gate = Qiick\\Standards\\Conformance\\Support\\DivergenceGate::fromBasePath(
    base_path(),
    array_map(fn ($c) => $c['id'], $catalog),
);
$results = [];
foreach ($catalog as $check) {
    if ($check['id'] === 'C37') {
        try {
            $gate->assertDeclarationsAreValid();
            $results[] = ['id' => 'C37', 'status' => 'pass', 'detail' => ''];
        } catch (Throwable $e) {
            $results[] = ['id' => 'C37', 'status' => 'fail', 'detail' => $e->getMessage()];
        }
        continue;
    }
    if ($gate->isDiverged($check['id'])) {
        $results[] = ['id' => $check['id'], 'status' => 'skip', 'detail' => 'diverged'];
        continue;
    }
    try {
        $runner->run($check);
        $results[] = ['id' => $check['id'], 'status' => 'pass', 'detail' => ''];
    } catch (Throwable $e) {
        $results[] = ['id' => $check['id'], 'status' => 'fail', 'detail' => $e->getMessage()];
    }
}
echo json_encode($results, JSON_UNESCAPED_SLASHES), PHP_EOL;
`,
    );

    const env = {
        ...process.env,
        DB_CONNECTION: 'sqlite',
        DB_DATABASE: path.join(workDir, 'database/conformance-scan.sqlite'),
        APP_ENV: 'testing',
    };

    if (
        !fs.existsSync(path.join(workDir, '.env')) &&
        fs.existsSync(path.join(workDir, '.env.example'))
    ) {
        fs.copyFileSync(
            path.join(workDir, '.env.example'),
            path.join(workDir, '.env'),
        );
    }

    if (!fs.existsSync(path.join(workDir, 'vendor/autoload.php'))) {
        const install = spawnSync(
            'composer',
            ['install', '--no-interaction', '--prefer-dist', '--no-progress'],
            { cwd: workDir, env, encoding: 'utf8', timeout: 600_000 },
        );

        if (install.status !== 0) {
            return catalog.map((id) => ({
                id,
                status: 'fail',
                detail: `composer install failed: ${(install.stderr || install.stdout || '').slice(0, 200)}`,
            }));
        }
    }

    spawnSync('php', ['artisan', 'key:generate', '--ansi', '--force'], {
        cwd: workDir,
        env,
        encoding: 'utf8',
    });

    const migrate = spawnSync(
        'php',
        ['artisan', 'migrate:fresh', '--force', '--no-interaction'],
        { cwd: workDir, env, encoding: 'utf8', timeout: 300_000 },
    );

    if (migrate.status !== 0) {
        return catalog.map((id) => ({
            id,
            status: 'fail',
            detail: `migrate:fresh failed: ${(migrate.stderr || migrate.stdout || '').slice(0, 240)}`,
        }));
    }

    const scan = spawnSync('php', [runner], {
        cwd: workDir,
        env,
        encoding: 'utf8',
        timeout: 180_000,
    });

    if (scan.status !== 0) {
        return catalog.map((id) => ({
            id,
            status: 'fail',
            detail: `scan bootstrap failed: ${(scan.stderr || scan.stdout || '').slice(0, 240)}`,
        }));
    }

    try {
        return JSON.parse(scan.stdout.trim().split('\n').at(-1) ?? '[]');
    } catch {
        return catalog.map((id) => ({
            id,
            status: 'fail',
            detail: `bad scan output: ${scan.stdout.slice(0, 200)}`,
        }));
    }
}

/** @type {Record<string, { id: string, status: string, detail: string }[]>} */
const table = {};

for (const [name, productRoot] of Object.entries(products)) {
    if (!fs.existsSync(productRoot)) {
        console.error(`missing ${name} at ${productRoot}`);
        continue;
    }

    execFileSync('git', ['fetch', 'origin', 'develop', '-q'], {
        cwd: productRoot,
        stdio: 'pipe',
    });

    const workDir = fs.mkdtempSync(
        path.join(os.tmpdir(), `qiick-conformance-${name}-`),
    );
    // git worktree wants an empty path; mkdtemp already created it.
    removeTree(workDir);
    console.error(`scanning ${name}…`);

    try {
        overlaySuite(productRoot, workDir);
        table[name] = runChecks(workDir);
    } catch (error) {
        table[name] = catalog.map((id) => ({
            id,
            status: 'fail',
            detail: error instanceof Error ? error.message : String(error),
        }));
    } finally {
        try {
            execFileSync('git', ['worktree', 'remove', '--force', workDir], {
                cwd: productRoot,
                stdio: 'pipe',
            });
        } catch {
            removeTree(workDir);
        }
    }
}

const reportPath = path.join(
    root,
    'standards/php/conformance-harness/PRODUCT-SCAN.md',
);
const lines = [
    '# Conformance scan against origin/develop (read-only)',
    '',
    'Generated locally for the fleet conformance PR. Driver: sqlite (schema/config/file checks; engine-dependent C3/C5/C11/C15 refuse sqlite when they require PG/MySQL).',
    '',
];

for (const [name, results] of Object.entries(table)) {
    const failed = results.filter((result) => result.status === 'fail');
    const passed = results.filter((result) => result.status === 'pass');
    const skipped = results.filter((result) => result.status === 'skip');
    lines.push(`## ${name}`);
    lines.push('');
    lines.push(
        `Passed: ${passed.length}, failed: ${failed.length}, diverged/skipped: ${skipped.length}`,
    );
    lines.push('');
    lines.push('| Id | Status | Detail |');
    lines.push('| --- | --- | --- |');

    for (const result of results) {
        const detail = result.detail
            .replace(/\|/g, '\\|')
            .replace(/\n/g, ' ')
            .slice(0, 160);
        lines.push(`| ${result.id} | ${result.status} | ${detail} |`);
    }

    lines.push('');
    lines.push(
        `**Failing:** ${failed.map((result) => result.id).join(', ') || '(none)'}`,
    );
    lines.push('');
}

fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
console.log(lines.join('\n'));
console.error(`wrote ${reportPath}`);
