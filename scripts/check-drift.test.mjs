/**
 * Behaviour of scripts/check-drift.mjs against the committed public/r (#5).
 *
 * Usage: node --test scripts/
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts/check-drift.mjs');
const buttonSource = fs.readFileSync(
    path.join(root, 'registry/src/components/ui/button.tsx'),
    'utf8',
);
const utilsSource = fs.readFileSync(
    path.join(root, 'registry/src/lib/utils.ts'),
    'utf8',
);

/** A Laravel-shaped app with the button and utils items installed. */
function makeApp() {
    const app = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-drift-'));
    const write = (file, content) => {
        fs.mkdirSync(path.dirname(path.join(app, file)), { recursive: true });
        fs.writeFileSync(path.join(app, file), content);
    };

    write(
        'components.json',
        JSON.stringify({
            registries: {
                '@qiick': path.join(root, 'public/r/{name}.json'),
            },
        }),
    );
    write(
        'tsconfig.json',
        JSON.stringify({
            compilerOptions: { paths: { '@/*': ['./resources/js/*'] } },
        }),
    );
    write('resources/js/components/ui/button.tsx', buttonSource);
    write('resources/js/lib/utils.ts', utilsSource);

    return { app, write };
}

const run = (app) =>
    spawnSync(process.execPath, [script, '--cwd', app], { encoding: 'utf8' });

test('passes when installed files match the registry', () => {
    const { app } = makeApp();
    const result = run(app);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /2 files match/);
});

test('fails with a diff on a changed file, passes once it is overridden', () => {
    const { app, write } = makeApp();
    const changed = buttonSource.replace('rounded-md', 'rounded-full');

    write('resources/js/components/ui/button.tsx', changed);

    const failed = run(app);

    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /button\.tsx \(button\) differs/);
    assert.match(failed.stderr, /\+ \d+: .*rounded-full/);

    write(
        'app-ui.overrides.json',
        JSON.stringify({
            'resources/js/components/ui/button.tsx': 'Pill buttons',
        }),
    );

    const passed = run(app);

    assert.equal(passed.status, 0, passed.stderr);
    assert.match(passed.stdout, /1 overridden/);
});

test('fails on an override that is no longer needed', () => {
    const { app, write } = makeApp();

    write(
        'app-ui.overrides.json',
        JSON.stringify({ 'resources/js/lib/utils.ts': 'Old change' }),
    );

    const result = run(app);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /matches the registry again/);
});

test('fails on a missing file of an installed item, passes once it is overridden', () => {
    const { app, write } = makeApp();
    const pageLayout = JSON.parse(
        fs.readFileSync(path.join(root, 'public/r/page-layout.json'), 'utf8'),
    );

    write(
        'resources/js/components/layout/page-layout.tsx',
        pageLayout.files[0].content,
    );

    const failed = run(app);

    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /list-per-page\.ts \(page-layout\) is missing/);

    write(
        'app-ui.overrides.json',
        JSON.stringify({
            'resources/js/lib/list-per-page.ts': 'Kept in another module',
        }),
    );

    const passed = run(app);

    assert.equal(passed.status, 0, passed.stderr);
    assert.match(passed.stdout, /1 overridden/);
});
