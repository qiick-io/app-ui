<?php

declare(strict_types=1);

namespace Qiick\Standards\Erasure\Support;

use Illuminate\Cache\Events\KeyWritten;
use Illuminate\Database\Connection;
use Illuminate\Log\Events\MessageLogged;

/**
 * Records, while one erasure or one seeding runs, the package's own events
 * and every log record, as flat lists of strings, and the cache keys written,
 * so E5, E7, E8 and E13 can inspect them.
 *
 * It listens through a wildcard listener that cannot be removed again, so
 * stop() only disarms it.
 */
final class ErasureRecording
{
    /** @var list<array{name: string, transactionLevel: int, strings: list<string>}> */
    private array $packageEvents = [];

    /** @var list<string> */
    private array $logStrings = [];

    /** @var list<string> */
    private array $writtenCacheKeys = [];

    private bool $isRecording = true;

    public function __construct(
        private readonly string $packageRootNamespace,
        private readonly Connection $connection,
        private readonly int $maximumCollectedStrings,
    ) {}

    /**
     * @param  array<int, mixed>  $payload
     */
    public function listen(string $eventName, array $payload): void
    {
        if (! $this->isRecording) {
            return;
        }

        if ($eventName === MessageLogged::class && ($payload[0] ?? null) instanceof MessageLogged) {
            $this->logStrings = [...$this->logStrings, ...$this->collectStrings([$payload[0]->message, $payload[0]->context])];

            return;
        }

        if ($eventName === KeyWritten::class && ($payload[0] ?? null) instanceof KeyWritten) {
            $this->writtenCacheKeys[] = $payload[0]->key;

            return;
        }

        if (str_starts_with($eventName, $this->packageRootNamespace)) {
            $this->packageEvents[] = [
                'name' => $eventName,
                'transactionLevel' => $this->connection->transactionLevel(),
                'strings' => $this->collectStrings($payload),
            ];
        }
    }

    public function stop(): void
    {
        $this->isRecording = false;
    }

    /**
     * @return list<array{name: string, transactionLevel: int, strings: list<string>}>
     */
    public function packageEvents(): array
    {
        return $this->packageEvents;
    }

    /**
     * @return list<string>
     */
    public function writtenCacheKeys(): array
    {
        return $this->writtenCacheKeys;
    }

    /**
     * @return list<string>
     */
    public function logStrings(): array
    {
        return $this->logStrings;
    }

    /**
     * Every scalar inside the value, private object properties included,
     * bounded in depth and count so a large object graph cannot stall a check.
     *
     * @return list<string>
     */
    private function collectStrings(mixed $value): array
    {
        $strings = [];
        $pending = [[$value, 0]];

        while ($pending !== [] && count($strings) < $this->maximumCollectedStrings) {
            [$current, $depth] = array_pop($pending);

            if (is_scalar($current)) {
                $strings[] = (string) $current;

                continue;
            }

            if ($depth >= 6 || (! is_array($current) && ! is_object($current))) {
                continue;
            }

            foreach ((array) $current as $key => $child) {
                $strings[] = (string) $key;
                $pending[] = [$child, $depth + 1];
            }
        }

        return $strings;
    }
}
