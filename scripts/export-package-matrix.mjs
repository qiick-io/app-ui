#!/usr/bin/env node
/**
 * Exports the canonical PHP matrix and server database services for a package.
 * The package's default Pest matrix covers SQLite; only server databases need
 * service containers. A package may exclude PHP versions below its minimum.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Applies package-specific PHP exclusions and removes SQLite from the
 * service-container list.
 *
 * @param {{matrix: {php: string[]}, databases: {image: string | null}[]}} packageMatrixDocument
 * @param {string[]} excludedPhpVersions
 * @returns {{matrix: {php: string[]} & Record<string, unknown>, databases: {image: string}[]}}
 */
export function createPackageMatrixOutputs(
    packageMatrixDocument,
    excludedPhpVersions,
) {
    if (!Array.isArray(excludedPhpVersions)) {
        throw new TypeError('PHP exclusions must be a JSON array.');
    }

    const unsupportedPhpVersions = excludedPhpVersions.filter(
        (phpVersion) =>
            typeof phpVersion !== 'string' ||
            !packageMatrixDocument.matrix.php.includes(phpVersion),
    );

    if (unsupportedPhpVersions.length > 0) {
        throw new Error(
            `PHP exclusions must name versions in the shared matrix: ${unsupportedPhpVersions.join(', ')}.`,
        );
    }

    const supportedPhpVersions = packageMatrixDocument.matrix.php.filter(
        (phpVersion) => !excludedPhpVersions.includes(phpVersion),
    );

    if (supportedPhpVersions.length === 0) {
        throw new Error(
            'PHP exclusions cannot remove every shared PHP version.',
        );
    }

    return {
        matrix: {
            ...packageMatrixDocument.matrix,
            php: supportedPhpVersions,
        },
        databases: packageMatrixDocument.databases.filter(
            (database) => database.image !== null,
        ),
    };
}

const scriptPath = fileURLToPath(import.meta.url);

if (process.argv[1] === scriptPath) {
    const repositoryRoot = path.resolve(path.dirname(scriptPath), '..');
    const packageMatrixPath = path.join(
        repositoryRoot,
        'standards',
        'package-matrix.json',
    );
    const packageMatrixDocument = JSON.parse(
        fs.readFileSync(packageMatrixPath, 'utf8'),
    );
    const excludedPhpVersions = JSON.parse(
        process.env.EXCLUDE_PHP_VERSIONS ?? '[]',
    );
    const packageMatrixOutputs = createPackageMatrixOutputs(
        packageMatrixDocument,
        excludedPhpVersions,
    );

    process.stdout.write(
        `matrix=${JSON.stringify(packageMatrixOutputs.matrix)}\n`,
    );
    process.stdout.write(
        `databases=${JSON.stringify(packageMatrixOutputs.databases)}\n`,
    );
}
