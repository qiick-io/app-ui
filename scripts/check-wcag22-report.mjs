import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** A fresh runner report must contain the results of an actual axe invocation. */
export function checkWcag22Report(report) {
    const checks = report
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    const violations = new Set();
    const needsReview = new Set();

    for (const check of checks) {
        if (
            !['target-size', 'focus-not-obscured'].includes(check?.rule) ||
            !Array.isArray(check.violations) ||
            !Array.isArray(check.needsReview)
        ) {
            throw new Error('Invalid WCAG 2.2 browser report.');
        }

        for (const finding of check.violations) {
            violations.add(
                JSON.stringify({
                    rule: check.rule,
                    page: check.page,
                    ...finding,
                }),
            );
        }
        for (const finding of check.needsReview) {
            needsReview.add(
                JSON.stringify({
                    rule: check.rule,
                    page: check.page,
                    ...finding,
                }),
            );
        }
    }

    if (!checks.some((check) => check.rule === 'target-size')) {
        throw new Error(
            'The WCAG 2.2 suite did not report any target-size checks.',
        );
    }

    return { violations: [...violations], needsReview: [...needsReview] };
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    try {
        const { violations, needsReview } = checkWcag22Report(
            readFileSync(process.argv[2], 'utf8'),
        );
        for (const finding of needsReview) {
            process.stdout.write(`WCAG 2.2 needs manual review: ${finding}\n`);
        }
        for (const finding of violations) {
            process.stderr.write(`WCAG 2.2 violation: ${finding}\n`);
        }
        process.exitCode = violations.length ? 1 : 0;
    } catch (error) {
        process.stderr.write(`WCAG 2.2: ${error.message}\n`);
        process.exitCode = 1;
    }
}
