import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { scaffoldProduct } from './new-product.mjs';
import { syncStandards } from './sync-standards.mjs';

/**
 * A throwaway starter-kit app: `artisan` and the kit's `components.json`.
 */
function makeStarterKitApp() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-new-product-'));

    fs.writeFileSync(path.join(root, 'artisan'), '');
    fs.writeFileSync(
        path.join(root, 'components.json'),
        JSON.stringify({
            style: 'new-york',
            aliases: { ui: '@/components/ui' },
        }),
    );

    return root;
}

const readJson = (root, file) =>
    JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('scaffolds a starter-kit app into a synced qiick product pinned to one ref', () => {
    const root = makeStarterKitApp();

    scaffoldProduct({
        targetRoot: root,
        appName: 'acme',
        preset: 'Blue',
        ref: 'v1.2.3',
    });

    assert.equal(readJson(root, 'qiick-standards.json').ref, 'v1.2.3');
    assert.equal(readJson(root, 'qiick-standards.json').app, true);
    assert.equal(
        readJson(root, 'components.json').registries['@qiick'],
        'https://raw.githubusercontent.com/qiick-io/app-ui/v1.2.3/public/r/{name}.json',
    );
    assert.equal(readJson(root, 'components.json').style, 'new-york');

    const workflow = fs.readFileSync(
        path.join(root, '.github/workflows/qiick.yml'),
        'utf8',
    );

    assert.match(workflow, /drift-check\.yml@v1\.2\.3/);
    assert.match(workflow, /package: qiick\/acme/);
    assert.doesNotMatch(workflow, /@develop/);
    assert.deepEqual(syncStandards(root, { isCheck: true }), []);
});

test('keeps an existing qiick-standards.json and refuses a non-Laravel target', () => {
    const root = makeStarterKitApp();

    fs.writeFileSync(
        path.join(root, 'qiick-standards.json'),
        JSON.stringify({ ref: 'v0.9.0', uiPreset: 'Teal', app: true }),
    );
    scaffoldProduct({
        targetRoot: root,
        appName: 'acme',
        preset: 'Teal',
        ref: 'v1.0.0',
    });

    assert.equal(readJson(root, 'qiick-standards.json').ref, 'v0.9.0');
    assert.match(
        readJson(root, 'components.json').registries['@qiick'],
        /\/v0\.9\.0\//,
    );

    fs.rmSync(path.join(root, 'artisan'));
    assert.throws(
        () =>
            scaffoldProduct({
                targetRoot: root,
                appName: 'acme',
                preset: 'Teal',
                ref: 'v1.0.0',
            }),
        /not a Laravel app/,
    );
    assert.throws(
        () =>
            scaffoldProduct({
                targetRoot: root,
                appName: 'Acme App',
                preset: 'Teal',
                ref: 'v1.0.0',
            }),
        /kebab-case/,
    );
});
