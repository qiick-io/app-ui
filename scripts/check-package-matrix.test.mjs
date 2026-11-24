import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
    findPackageMatrixViolations,
    listWorkflowFiles,
} from '../standards/scripts/check-package-matrix.mjs';
import { createPackageMatrixOutputs } from './export-package-matrix.mjs';

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
  databases:
    needs: package-matrix
    strategy:
      matrix:
        database: \${{ fromJSON(needs.package-matrix.outputs.databases) }}
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

    assert.equal(errors.length, 3);
    assert.match(errors[0], /package-matrix\.yml/);
    assert.match(errors[1], /outputs\.matrix/);
    assert.match(errors[2], /outputs\.databases/);
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
    const errors = findPackageMatrixViolations(root);

    assert.equal(errors.length, 2);
    assert.match(errors[0], /outputs\.matrix/);
    assert.match(errors[1], /outputs\.databases/);
});
