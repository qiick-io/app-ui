<?php

declare(strict_types=1);

use Qiick\Standards\Conformance\Support\DivergenceGate;

it('rejects an unknown check id', function (): void {
    $gate = new DivergenceGate(
        [
            'C999' => [
                'reason' => 'nope',
                'decision' => 'knowledge/decisions/2026-11-20-core-hardening',
                'review_by' => '2099-01-01',
            ],
        ],
        ['C1', 'C37'],
        new DateTimeImmutable('2026-11-20'),
    );

    expect(fn () => $gate->assertDeclarationsAreValid())
        ->toThrow(RuntimeException::class, 'Unknown conformance check id');
});

it('rejects an expired review_by', function (): void {
    $gate = new DivergenceGate(
        [
            'C1' => [
                'reason' => 'temporary',
                'decision' => 'knowledge/decisions/2026-11-20-core-hardening',
                'review_by' => '2020-01-01',
            ],
        ],
        ['C1', 'C37'],
        new DateTimeImmutable('2026-11-20'),
    );

    expect(fn () => $gate->assertDeclarationsAreValid())
        ->toThrow(RuntimeException::class, 'expired');
});

it('rejects a stale divergence when the check now passes', function (): void {
    $gate = new DivergenceGate(
        [
            'C1' => [
                'reason' => 'temporary',
                'decision' => 'knowledge/decisions/2026-11-20-core-hardening',
                'review_by' => '2099-01-01',
            ],
        ],
        ['C1', 'C37'],
        new DateTimeImmutable('2026-11-20'),
    );

    expect(fn () => $gate->assertNoStaleDeclarations(['C1']))
        ->toThrow(RuntimeException::class, 'stale');
});

it('accepts a valid future divergence', function (): void {
    $gate = new DivergenceGate(
        [
            'C1' => [
                'reason' => 'adoption window',
                'decision' => 'knowledge/decisions/2026-11-20-core-hardening',
                'review_by' => '2099-01-01',
            ],
        ],
        ['C1', 'C37'],
        new DateTimeImmutable('2026-11-20'),
    );

    $gate->assertDeclarationsAreValid();
    $gate->assertNoStaleDeclarations([]);
    expect($gate->isDiverged('C1'))->toBeTrue();
});
