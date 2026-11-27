import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
    findPackageMatrixViolations,
    listWorkflowFiles,
} from '../standards/scripts/check-package-matrix.mjs';
import {
    createPackageMatrixOutputs,
    createPullRequestPlan,
} from './export-package-matrix.mjs';

const packageMatrixJsonPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../standards/package-matrix.json',
);

/**
 * Temporary package repo with optional workflow files.
 * @param {Record<string, string>} workflows - basename → YAML body
 */
function makePackageFixture(workflows = {}) {
    const root = fs.mkdtempSync(
        path.join(os.tmpdir(), 'qiick-package-matrix-'),
    );
    const workflowsDirectory = path.join(root, '.github', 'workflows');

    fs.mkdirSync(workflowsDirectory, { recursive: true });

    for (const [name, body] of Object.entries(workflows)) {
        fs.writeFileSync(path.join(workflowsDirectory, name), body);
    }

    return root;
}

const consumingWorkflow = `
name: CI
concurrency:
  group: ci-\${{ github.event_name }}-\${{ github.ref }}
  cancel-in-progress: \${{ github.event_name == 'pull_request' }}
on:
  pull_request:
  schedule:
    - cron: '17 3 * * *'
jobs:
  package-matrix:
    uses: qiick-io/app-ui/.github/workflows/package-matrix.yml@v0.13.0
    with:
      app-ui-ref: v0.13.0
      exclude-php-versions: '[]'
  tests:
    needs: package-matrix
    strategy:
      matrix: \${{ fromJSON(needs.package-matrix.outputs.matrix) }}
    steps:
      - if: \${{ !matrix.skip }}
        run: vendor/bin/pest
  databases:
    needs: package-matrix
    strategy:
      matrix:
        database: \${{ fromJSON(needs.package-matrix.outputs.databases) }}
    steps:
      - if: needs.package-matrix.outputs.run-databases == 'true'
        run: vendor/bin/pest
  phpstan:
    needs: package-matrix
    steps:
      - if: needs.package-matrix.outputs.docs-only != 'true'
        run: vendor/bin/phpstan analyse
  nightly-failure:
    if: failure() && github.event_name == 'schedule'
    needs: [tests, databases]
    steps:
      - run: gh issue create --title "Nightly CI failed"
`;

test('canonical package-matrix.json has the supported axes and database engines', () => {
    const document = JSON.parse(fs.readFileSync(packageMatrixJsonPath, 'utf8'));

    assert.deepEqual(document.matrix.php, ['8.3', '8.4', '8.5']);
    assert.deepEqual(document.matrix.laravel, ['12', '13']);
    assert.deepEqual(document.matrix['dependency-version'], [
        'lowest',
        'stable',
    ]);
    assert.deepEqual(document.matrix.include, [
        { laravel: '12', testbench: '10' },
        { laravel: '13', testbench: '11' },
    ]);
    assert.deepEqual(document.matrix.exclude, []);

    const connections = document.databases.map(
        (database) => database.connection,
    );

    assert.deepEqual(connections, ['sqlite', 'pgsql', 'mysql', 'mariadb']);
    assert.deepEqual(
        document.databases.map((database) => database.name),
        ['SQLite', 'PostgreSQL 17', 'MySQL 8.4', 'MariaDB 11.4'],
    );

    for (const database of document.databases) {
        if (database.connection === 'sqlite') {
            assert.equal(database.image, null);
            continue;
        }

        assert.match(
            database.image,
            /^.+@sha256:[a-f0-9]{64}$/,
            `${database.name} must pin an image digest`,
        );
    }
});

test('a package can exclude unsupported PHP versions and gets service databases only', () => {
    const packageMatrixDocument = JSON.parse(
        fs.readFileSync(packageMatrixJsonPath, 'utf8'),
    );
    const defaultOutputs = createPackageMatrixOutputs(
        packageMatrixDocument,
        [],
    );
    const outputs = createPackageMatrixOutputs(packageMatrixDocument, ['8.3']);

    assert.deepEqual(defaultOutputs.matrix.php, ['8.3', '8.4', '8.5']);
    assert.deepEqual(outputs.matrix.php, ['8.4', '8.5']);
    assert.deepEqual(outputs.matrix.laravel, ['12', '13']);
    assert.deepEqual(
        outputs.databases.map((database) => database.connection),
        ['pgsql', 'mysql', 'mariadb'],
    );
    assert.ok(
        outputs.databases.every((database) =>
            database.image.includes('@sha256:'),
        ),
    );
});

test('invalid PHP exclusions fail instead of silently changing the matrix', () => {
    const packageMatrixDocument = JSON.parse(
        fs.readFileSync(packageMatrixJsonPath, 'utf8'),
    );

    assert.throws(
        () => createPackageMatrixOutputs(packageMatrixDocument, ['8.2']),
        /versions in the shared matrix/,
    );
    assert.throws(
        () =>
            createPackageMatrixOutputs(packageMatrixDocument, [
                '8.3',
                '8.4',
                '8.5',
            ]),
        /cannot remove every shared PHP version/,
    );
});

test('a package that consumes both outputs passes', () => {
    const root = makePackageFixture({ 'ci.yml': consumingWorkflow });

    assert.deepEqual(findPackageMatrixViolations(root), []);
    assert.equal(listWorkflowFiles(root).length, 1);
});

test('a package with a private matrix fails every required signal', () => {
    const root = makePackageFixture({
        'ci.yml': `
name: CI
jobs:
  tests:
    strategy:
      matrix:
        php: ['8.3', '8.4']
        laravel: ['12']
`,
    });
    const errors = findPackageMatrixViolations(root);

    assert.equal(errors.length, 9);
    assert.match(errors[0], /package-matrix\.yml/);
    assert.match(errors[1], /outputs\.matrix/);
    assert.match(errors[2], /outputs\.databases/);
    assert.match(
        errors.slice(3).join('\n'),
        /matrix\.skip[\s\S]*run-databases[\s\S]*docs-only[\s\S]*cancel-in-progress[\s\S]*cron[\s\S]*gh issue create/,
    );
});

test('missing workflows directory fails', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-package-empty-'));
    const errors = findPackageMatrixViolations(root);

    assert.equal(errors.length, 1);
    assert.match(errors[0], /no workflow/);
});

test('calling the workflow without fromJSON still fails', () => {
    const root = makePackageFixture({
        'ci.yml': `
jobs:
  package-matrix:
    uses: qiick-io/app-ui/.github/workflows/package-matrix.yml@v0.13.0
  tests:
    needs: package-matrix
    strategy:
      matrix:
        php: ['8.3']
`,
    });
    const errors = findPackageMatrixViolations(root).slice(0, 2);

    assert.match(errors[0], /outputs\.matrix/);
    assert.match(errors[1], /outputs\.databases/);
});

test('a mutation job must mutate only the classes a pull request changed', () => {
    const root = makePackageFixture({
        'ci.yml':
            consumingWorkflow +
            '  mutation:\n    name: Mutation (per-class ≥95%)\n',
    });

    assert.match(
        findPackageMatrixViolations(root).join('\n'),
        /outputs\.mutate-classes/,
    );
});

test('a job that skips itself on the plan fails: its required check would never report', () => {
    const root = makePackageFixture({
        'ci.yml': consumingWorkflow.replace(
            '  databases:\n    needs: package-matrix\n',
            "  databases:\n    needs: package-matrix\n    if: needs.package-matrix.outputs.run-databases == 'true'\n",
        ),
    });

    assert.match(
        findPackageMatrixViolations(root).join('\n'),
        /skips itself on the pull request plan/,
    );
    assert.deepEqual(
        findPackageMatrixViolations(
            makePackageFixture({ 'ci.yml': consumingWorkflow }),
        ),
        [],
    );
});

test('the pull request variant runs only what the changed files can break', () => {
    const document = JSON.parse(fs.readFileSync(packageMatrixJsonPath, 'utf8'));
    const fullMatrix = createPackageMatrixOutputs(document, []).matrix;
    const plan = (files) => createPullRequestPlan(document, fullMatrix, files);
    const cellNames = (files) =>
        plan(files).matrix.include.map(
            (cell) =>
                `PHP ${cell.php} Laravel ${cell.laravel} ${cell['dependency-version']}${cell.skip ? ' (skipped)' : ''}`,
        );

    // Docs only: both cells report with their steps skipped.
    assert.deepEqual(cellNames(['README.md', 'docs/install.md']), [
        'PHP 8.5 Laravel 13 stable (skipped)',
        'PHP 8.3 Laravel 12 lowest (skipped)',
    ]);
    assert.equal(plan(['docs/install.md']).runDatabases, false);
    assert.equal(plan(['docs/install.md']).isDocsOnly, true);
    assert.equal(plan(['docs/install.md', 'src/Token.php']).isDocsOnly, false);
    assert.deepEqual(plan(['docs/install.md']).mutateClasses, []);

    // Tests only: the highest cell and databases run, the lowest only reports.
    assert.deepEqual(cellNames(['tests/Unit/TokenTest.php']), [
        'PHP 8.5 Laravel 13 stable',
        'PHP 8.3 Laravel 12 lowest (skipped)',
    ]);
    assert.equal(plan(['tests/Unit/TokenTest.php']).runDatabases, true);

    // Code: both ends and the databases.
    assert.deepEqual(cellNames(['src/Token.php']), [
        'PHP 8.5 Laravel 13 stable',
        'PHP 8.3 Laravel 12 lowest',
    ]);
    assert.equal(plan(['src/Token.php']).runDatabases, true);
    assert.equal(
        plan(['src/Stores/DatabaseTokenStore.php']).runDatabases,
        true,
    );
    assert.equal(plan(['database/migrations/x.php']).runDatabases, true);
    assert.deepEqual(
        cellNames(['composer.json']),
        cellNames(['src/Token.php']),
    );

    // Mutation: changed src/ classes only, never the fakes.
    assert.deepEqual(
        plan(['src/Token.php', 'src/Testing/FakeTokenStore.php', 'tests/A.php'])
            .mutateClasses,
        ['src/Token.php'],
    );
});

test('non-docs PRs select the server databases without matching implementation paths', () => {
    const document = JSON.parse(fs.readFileSync(packageMatrixJsonPath, 'utf8'));
    const fullMatrix = createPackageMatrixOutputs(document, []).matrix;

    for (const changedFile of [
        'src/Delivery/WebhookDeliveryCoordinator.php',
        'src/Webhooks/SecretRotator.php',
        'src/Webhooks/DatabaseWebhookSecretResolver.php',
        'tests/Feature/Webhooks/Delivery/ParallelWorkersTest.php',
        'src/Erasure/ErasePersonAction.php',
        'tests/Erasure/fixture.php',
        'tests/Erasure/run.mjs',
        'tests/Pest.php',
        'tests/TestCase.php',
        'tests/Support/PackageTestCase.php',
        'TestCase.php',
        'phpunit.xml',
        '.github/workflows/ci.yml',
        '.github/workflows/erasure.yaml',
    ]) {
        const plan = createPullRequestPlan(document, fullMatrix, [changedFile]);

        assert.equal(plan.runDatabases, true, changedFile);
        assert.equal(plan.matrix.include[0].skip, false, changedFile);
    }
});

test('the lowest cell follows a package PHP exclusion', () => {
    const document = JSON.parse(fs.readFileSync(packageMatrixJsonPath, 'utf8'));
    const fullMatrix = createPackageMatrixOutputs(document, ['8.3']).matrix;
    const lowest = createPullRequestPlan(document, fullMatrix, ['src/A.php'])
        .matrix.include[1];

    assert.deepEqual(lowest, {
        php: '8.4',
        laravel: '12',
        'dependency-version': 'lowest',
        testbench: '10',
        skip: false,
    });
});

test('the exporter leaves the classes a pull request deleted out of mutate-classes', () => {
    const packageRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), 'qiick-package-checkout-'),
    );

    fs.mkdirSync(path.join(packageRoot, 'src'));
    fs.writeFileSync(path.join(packageRoot, 'src/Kept.php'), '<?php\n');

    const output = execFileSync(
        process.execPath,
        [
            fileURLToPath(
                new URL('./export-package-matrix.mjs', import.meta.url),
            ),
        ],
        {
            encoding: 'utf8',
            env: {
                ...process.env,
                VARIANT: 'pr',
                CHANGED_FILES: 'src/Kept.php\nsrc/Deleted.php\n',
                PACKAGE_ROOT: packageRoot,
                EXCLUDE_PHP_VERSIONS: '[]',
            },
        },
    );

    assert.match(output, /^mutate-classes=\["src\/Kept\.php"\]$/m);
    assert.match(output, /^docs-only=false$/m);
    assert.match(output, /^mutate-scope=changed$/m);
});
