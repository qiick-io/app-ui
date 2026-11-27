import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
    checkSecurityTxt,
    findFleetSecurityViolations,
} from '../standards/scripts/check-fleet-security.mjs';

const repository = 'qiick-io/example';
const policyPath = 'SECURITY.md';
const now = new Date('2026-11-27T00:00:00Z');
const validExpiry = '2027-11-27T00:00:00Z';
const validText = `Contact: https://github.com/${repository}/security/advisories/new
Expires: ${validExpiry}
Preferred-Languages: en, it
Policy: https://github.com/${repository}/blob/HEAD/${policyPath}
`;

test('F31 accepts a valid policy and warns inclusively at 30 days', () => {
    assert.deepEqual(checkSecurityTxt(validText, repository, policyPath, now), {
        errors: [],
        warnings: [],
    });

    const renewing = validText.replace(validExpiry, '2026-12-27T00:00:00Z');
    const result = checkSecurityTxt(renewing, repository, policyPath, now);

    assert.deepEqual(result.errors, []);
    assert.match(result.warnings[0], /expires on 2026-12-27/);
});

test('F31 rejects missing or duplicate fields, impossible dates and expiry outside the window', () => {
    const invalidTexts = [
        validText.replace('en, it', 'en'),
        validText.replace('/example/security', '/other/security'),
        validText.replace('Policy: ', '# Policy: '),
        validText + `Expires: ${validExpiry}\n`,
        ...[
            '2027-02-30T00:00:00Z',
            '2026-11-27T00:00:00Z',
            '2027-11-27T00:00:01Z',
        ].map((expiry) => validText.replace(validExpiry, expiry)),
    ];

    for (const contents of invalidTexts) {
        assert.equal(
            checkSecurityTxt(contents, repository, policyPath, now).errors
                .length,
            1,
        );
    }
});

test('F32 and F33 apply only to public fleet callers and check release attestations together', (context) => {
    const root = fs.mkdtempSync(
        path.join(os.tmpdir(), 'qiick-fleet-security-'),
    );
    context.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const workflows = path.join(root, '.github/workflows');
    fs.mkdirSync(workflows, { recursive: true });
    const checkPublicFleet = () =>
        findFleetSecurityViolations(
            root,
            { repository, isPublicFleet: true },
            now,
        ).errors;

    assert.deepEqual(findFleetSecurityViolations(root, { repository }, now), {
        errors: [],
        warnings: [],
    });
    assert.deepEqual(
        checkPublicFleet().map((error) => error.slice(0, 3)),
        ['F32', 'F32', 'F33'],
    );

    fs.writeFileSync(
        path.join(root, 'README.md'),
        `https://api.scorecard.dev/projects/github.com/${repository}/badge`,
    );
    fs.writeFileSync(
        path.join(workflows, 'security.yml'),
        `on:
  push:
    branches: [develop]
  schedule:
    - cron: '17 5 * * 1'
jobs:
  codeql:
    uses: qiick-io/app-ui/.github/workflows/codeql.yml@${'a'.repeat(40)} # immutable
  scorecard:
    uses: ./.github/workflows/scorecard.yml
`,
    );
    const releaseWorkflow = path.join(workflows, 'security-release.yml');
    const release = `on:
  release:
    types: [published]
jobs:
  sbom:
    uses: ./.github/workflows/release-sbom.yml
  publish:
    steps:
      - uses: actions/attest-build-provenance@${'a'.repeat(40)}
`;
    fs.writeFileSync(releaseWorkflow, release);
    assert.match(checkPublicFleet()[0], /^F33: attest/);
    fs.writeFileSync(
        releaseWorkflow,
        release + `      - uses: actions/attest-sbom@${'a'.repeat(40)}\n`,
    );
    assert.deepEqual(checkPublicFleet(), []);
});
