<?php

declare(strict_types=1);

namespace Qiick\Demo\Erasure;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Qiick\Demo\Events\SubjectErasedEvent;
use RuntimeException;

/**
 * The reference eraser the harness proves the erasure suite against.
 *
 * It owns two demo stores: `demo_profiles`, scoped by organisation, and
 * `demo_links`, global. It also owns one cache entry. `$defect` switches on one
 * deliberate rule break at a time, so each check can be shown RED on it and
 * GREEN without it.
 */
final class DemoEraser
{
    public const string DELETE = 'delete';

    public const string ANONYMISE = 'anonymise';

    /** The rule break the next run commits; null for the correct eraser. */
    public static ?string $defect = null;

    /** False makes every organisation-scoped run throw OrganisationScopeUnsupportedException (E14). */
    public static bool $isOrganisationScopeSupported = true;

    /**
     * @param  list<string>  $publicIds
     * @param  list<string>  $identifiers
     */
    public function erase(
        string $userId,
        string $userPublicId,
        string $mode,
        array $publicIds = [],
        array $identifiers = [],
        ?string $organisationId = null,
        bool $dryRun = false,
    ): ErasureReport {
        $this->validate($userPublicId, $mode, $publicIds, $identifiers);

        if ($organisationId !== null && ! self::$isOrganisationScopeSupported) {
            throw new OrganisationScopeUnsupportedException('This store cannot filter erasures by organisation.');
        }

        $isDeleting = $mode === self::DELETE;
        $profiles = fn (): Builder => DB::table('demo_profiles')
            ->where('user_id', $userId)
            ->when(
                $organisationId !== null && self::$defect !== 'ignore_organisation',
                fn (Builder $query): Builder => $query->where('organisation_id', $organisationId),
            );
        $links = fn (): Builder => DB::table('demo_links')->whereIn('owner_public_id', [$userPublicId, ...$publicIds]);
        $isLinksInScope = $organisationId === null || self::$defect === 'ignore_organisation';
        $profileCount = self::$defect === 'skip_scoped' && $organisationId !== null ? 0 : $profiles()->count();
        $linkCount = self::$defect === 'skip_links' ? 0 : $links()->count();
        $phantomChange = self::$defect === 'report_phantom_change' ? 1 : 0;

        $report = new ErasureReport('qiick/demo', $mode, $dryRun, [
            'demo_profiles' => $this->counts($profileCount, $isDeleting, $phantomChange, null),
            'demo_links' => $isLinksInScope
                ? $this->counts($linkCount, $isDeleting, 0, null)
                : $this->counts(0, $isDeleting, 0, $linkCount > 0 ? 'outside_organisation_scope' : null, $linkCount),
        ]);

        if (self::$defect === 'log_identifier' && $identifiers !== []) {
            Log::info('Erasing '.$identifiers[0]);
        }

        if (self::$defect === 'throw_when_empty' && $profileCount + $linkCount === 0) {
            throw new RuntimeException('Nothing to erase.');
        }

        if ($dryRun && self::$defect !== 'dry_run_writes') {
            return $report;
        }

        $writeStores = function () use ($profiles, $links, $profileCount, $linkCount, $isDeleting, $isLinksInScope): void {
            if (self::$defect === 'erase_everyone') {
                DB::table('demo_profiles')->delete();
            } elseif ($profileCount > 0 && $isDeleting) {
                $profiles()->delete();
            } elseif ($profileCount > 0) {
                $profiles()->update(['user_id' => 'erased', 'email' => null, 'ip_address' => null, 'anonymised_at' => now()]);
            }

            if ($isLinksInScope && $linkCount > 0 && $isDeleting) {
                $links()->delete();
            } elseif ($isLinksInScope && $linkCount > 0) {
                $links()->update(['owner_public_id' => 'erased']);
            }

            if (self::$defect === 'event_inside_transaction') {
                event(new SubjectErasedEvent(new ErasureReport('qiick/demo', 'delete', false, [])));
            }
        };

        if (self::$defect === 'no_transaction') {
            $writeStores();
        } else {
            DB::transaction($writeStores);
        }

        DB::afterCommit(function () use ($userPublicId, $report, $organisationId): void {
            if ($organisationId === null && self::$defect !== 'keep_cache') {
                Cache::forget("demo:{$userPublicId}");
            }

            if (self::$defect !== 'event_inside_transaction') {
                event(new SubjectErasedEvent($report));
            }
        });

        return $report;
    }

    /**
     * @param  list<string>  $publicIds
     * @param  list<string>  $identifiers
     */
    private function validate(string $userPublicId, string $mode, array $publicIds, array $identifiers): void
    {
        if (! in_array($mode, [self::DELETE, self::ANONYMISE], true) && self::$defect !== 'accept_bad_mode') {
            throw new InvalidArgumentException('The erasure mode must be delete or anonymise.');
        }

        foreach ([$userPublicId, ...$publicIds] as $publicId) {
            if (! Str::isUuid($publicId)) {
                throw new InvalidArgumentException('Every public id must be a UUID.');
            }
        }

        foreach ($identifiers as $identifier) {
            if (! is_string($identifier) || trim($identifier) === '') {
                throw new InvalidArgumentException('Every identifier must be a non-empty string.');
            }
        }
    }

    /**
     * @return array{deleted: int, anonymised: int, kept: int, reason: ?string}
     */
    private function counts(int $rowCount, bool $isDeleting, int $phantomChange, ?string $keptReason, int $keptCount = 0): array
    {
        return [
            'deleted' => $isDeleting ? $rowCount : 0,
            'anonymised' => ($isDeleting ? 0 : $rowCount) + $phantomChange,
            'kept' => $keptCount,
            'reason' => $keptReason,
        ];
    }
}
