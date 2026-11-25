import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const scriptPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../standards/scripts/migrations-frozen.sh',
);

const migrationContent = (body) =>
    `<?php\n\nreturn new class {\n    public function up(): void\n    {\n        // ${body}\n    }\n};\n`;

/**
 * Run a git command in `cwd`; throw on non-zero.
 * @param {string} cwd
 * @param {string[]} args
 */
function git(cwd, args) {
    const result = spawnSync('git', args, {
        cwd,
        encoding: 'utf8',
        env: {
            ...process.env,
            GIT_AUTHOR_NAME: 'migrations-frozen-test',
            GIT_AUTHOR_EMAIL: 'test@example.com',
            GIT_COMMITTER_NAME: 'migrations-frozen-test',
            GIT_COMMITTER_EMAIL: 'test@example.com',
        },
    });

    if (result.status !== 0) {
        throw new Error(
            `git ${args.join(' ')} failed (${result.status}): ${result.stderr}`,
        );
    }

    return result.stdout.trim();
}

/**
 * Empty product repo with `database/migrations` and an `origin` remote.
 * Callers commit, tag and push `origin/main` themselves.
 */
function makeEmptyFixtureRepo() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-migrations-'));
    const remote = fs.mkdtempSync(
        path.join(os.tmpdir(), 'qiick-migrations-remote-'),
    );

    git(remote, ['init', '--bare', '-b', 'main']);
    git(root, ['init', '-b', 'main']);
    git(root, ['remote', 'add', 'origin', remote]);
    fs.mkdirSync(path.join(root, 'database', 'migrations'), {
        recursive: true,
    });

    return {
        root,
        migrationsDirectory: path.join(root, 'database', 'migrations'),
        writeMigration(name, body) {
            fs.writeFileSync(
                path.join(root, 'database', 'migrations', name),
                migrationContent(body),
            );
        },
        commit(message) {
            git(root, ['add', '-A', 'database/migrations']);
            git(root, ['commit', '-m', message]);
        },
        tag(name, commit) {
            git(root, commit ? ['tag', name, commit] : ['tag', name]);
        },
        pushOriginMain() {
            git(root, ['push', 'origin', 'HEAD:refs/heads/main']);
            git(root, ['fetch', 'origin']);
        },
        blobOf(name) {
            return git(root, [
                'hash-object',
                path.join('database', 'migrations', name),
            ]);
        },
        revParse(ref) {
            return git(root, ['rev-parse', ref]);
        },
    };
}

/**
 * Run migrations-frozen.sh in a fixture repo.
 * @param {string} root
 * @param {{ scriptPath?: string }} [options]
 */
function runFrozenCheck(root, options = {}) {
    const result = spawnSync('bash', [options.scriptPath ?? scriptPath], {
        cwd: root,
        encoding: 'utf8',
    });

    return {
        status: result.status ?? 1,
        stdout: result.stdout,
        stderr: result.stderr,
    };
}

const createUsers = '2024_01_01_000000_create_users_table.php';
const addTenancy = '2024_06_01_000000_add_tenancy_to_users_table.php';

test('(a) only beta tags + edited migration -> pass (and ignores .frozen)', () => {
    const fixture = makeEmptyFixtureRepo();

    fixture.writeMigration(createUsers, 'users-v1');
    fixture.commit('initial');
    fixture.tag('v1.0.0-beta.3');
    fixture.tag('v1.0.0-rc.1');
    fixture.pushOriginMain();

    const blob = fixture.blobOf(createUsers);
    fs.writeFileSync(
        path.join(fixture.migrationsDirectory, '.frozen'),
        `${blob}  database/migrations/${createUsers}\n`,
    );

    fixture.writeMigration(createUsers, 'users-edited-during-beta');

    const result = runFrozenCheck(fixture.root);

    assert.equal(result.status, 0);
    assert.match(
        result.stdout,
        /No stable release yet: migrations are editable \(decision 2026-11-20\)/,
    );
});

test('(b) stable tag + edited migration that exists at that tag -> fail', () => {
    const fixture = makeEmptyFixtureRepo();

    fixture.writeMigration(createUsers, 'users-v1');
    fixture.commit('initial');
    fixture.tag('v1.0.0');
    fixture.tag('v1.1.0-beta.1');
    fixture.pushOriginMain();

    fixture.writeMigration(createUsers, 'users-edited-after-stable');

    const result = runFrozenCheck(fixture.root);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /was modified: add a new migration instead/);
});

test('(c) stable tag: migration only on a later beta passes off origin/main, fails on it', () => {
    // Implemented rule: once a stable tag exists we still compare origin/main.
    // A migration added after the stable tag and edited on a later beta tip:
    // - passes when it is not on origin/main (only on the beta tip);
    // - fails when origin/main also has it (main moved past the stable tag).

    const passFixture = makeEmptyFixtureRepo();

    passFixture.writeMigration(createUsers, 'users-v1');
    passFixture.commit('stable create_');
    passFixture.tag('v1.0.0');
    passFixture.pushOriginMain();

    passFixture.writeMigration(addTenancy, 'tenancy-v1');
    passFixture.commit('beta: tenancy');
    passFixture.tag('v1.1.0-beta.1');
    passFixture.writeMigration(addTenancy, 'tenancy-edited');

    const passResult = runFrozenCheck(passFixture.root);

    assert.equal(passResult.status, 0, passResult.stderr);
    assert.match(passResult.stdout, /Migrations frozen: OK/);

    const failFixture = makeEmptyFixtureRepo();

    failFixture.writeMigration(createUsers, 'users-v1');
    failFixture.commit('stable create_');
    const stableCommit = failFixture.revParse('HEAD');
    failFixture.tag('v1.0.0', stableCommit);

    failFixture.writeMigration(addTenancy, 'tenancy-v1');
    failFixture.commit('main: tenancy after stable');
    failFixture.pushOriginMain();
    failFixture.tag('v1.1.0-beta.1');
    failFixture.writeMigration(addTenancy, 'tenancy-edited');

    const failResult = runFrozenCheck(failFixture.root);

    assert.equal(failResult.status, 1);
    assert.match(
        failResult.stderr,
        /2024_06_01_000000_add_tenancy_to_users_table\.php exists on origin\/main/,
    );
});

test('(d) mutation: treat beta tags as stable -> (a) goes red', () => {
    const mutatedScriptDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'qiick-migrations-mutated-'),
    );
    const mutatedScriptPath = path.join(
        mutatedScriptDirectory,
        'migrations-frozen.sh',
    );
    const original = fs.readFileSync(scriptPath, 'utf8');

    // Drop the stable-only filter so any v* tag freezes (pre-decision behaviour).
    const mutated = original.replace(
        "grep -E '^v[0-9]+\\.[0-9]+\\.[0-9]+$' | head -n 1 || true",
        'head -n 1',
    );

    assert.notEqual(
        mutated,
        original,
        'mutation must change the stable-tag filter',
    );
    fs.writeFileSync(mutatedScriptPath, mutated);
    fs.chmodSync(mutatedScriptPath, 0o755);

    const fixture = makeEmptyFixtureRepo();

    fixture.writeMigration(createUsers, 'users-v1');
    fixture.commit('initial');
    fixture.tag('v1.0.0-beta.3');
    fixture.pushOriginMain();
    fixture.writeMigration(createUsers, 'users-edited-during-beta');

    const result = runFrozenCheck(fixture.root, {
        scriptPath: mutatedScriptPath,
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /was modified: add a new migration instead/);
});

test('(F21) a migration added after the stable tag contracts only with a released contract: tag', () => {
    const fixture = makeEmptyFixtureRepo();
    const migration = (upBody, downBody = '') =>
        `<?php\n\nreturn new class {\n    public function up(): void\n    {\n${upBody}\n    }\n\n    public function down(): void\n    {\n${downBody}\n    }\n};\n`;
    const writeNew = (name, text) =>
        fs.writeFileSync(path.join(fixture.migrationsDirectory, name), text);
    const dropLegacyName = `        Schema::table('users', function (Blueprint $table) {\n            $table->dropColumn('legacy_name');\n        });`;
    const contractName = '2025_02_01_000000_drop_legacy_name_from_users.php';

    fixture.writeMigration(createUsers, 'users-v1');
    fixture.commit('initial');
    fixture.tag('v1.0.0');
    fixture.pushOriginMain();

    // Expand: an added column whose down() drops it breaks nothing.
    writeNew(
        addTenancy,
        migration(
            `        Schema::table('users', fn (Blueprint $table) => $table->uuid('organisation_id')->nullable());`,
            `        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('organisation_id'));`,
        ),
    );
    assert.equal(runFrozenCheck(fixture.root).status, 0);

    writeNew(contractName, migration(dropLegacyName));
    let result = runFrozenCheck(fixture.root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /without `\/\/ contract:/);

    writeNew(
        contractName,
        migration(
            `        // contract: users.legacy_name unused since v1.1.0\n${dropLegacyName}`,
        ),
    );
    result = runFrozenCheck(fixture.root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /names v1\.1\.0, which is not a released tag/);

    writeNew(
        contractName,
        migration(
            `        // contract: users.legacy_name unused since v1.0.0\n${dropLegacyName}`,
        ),
    );
    assert.equal(runFrozenCheck(fixture.root).status, 0);
});
