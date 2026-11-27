/**
 * Run after Pest loads axe. Call the rule explicitly so WCAG 2.2 target-size
 * coverage does not depend on the bundled axe default ruleset.
 * Source: https://dequeuniversity.com/rules/axe/4.10/target-size
 */
async () => {
    const { violations, incomplete } = await window.axe.run({
        runOnly: ['target-size'],
    });

    return {
        rule: 'target-size',
        violations: [
            ...violations.flatMap((violation) =>
                violation.nodes.map((node) => ({
                    target: node.target,
                    detail: node.failureSummary,
                })),
            ),
            ...incomplete
                .filter((result) => result.error)
                .map((result) => ({
                    target: [],
                    detail: result.error.message ?? String(result.error),
                })),
        ],
        needsReview: incomplete
            .filter((result) => !result.error)
            .flatMap((result) =>
                result.nodes.map((node) => ({
                    target: node.target,
                    detail: node.failureSummary ?? result.help,
                })),
            ),
    };
};
