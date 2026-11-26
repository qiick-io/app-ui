<?php

declare(strict_types=1);

namespace Qiick\Demo\Erasure;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Qiick\Demo\Events\SubjectErasedEvent;
use RuntimeException;
use Throwable;

/**
 * The reference eraser the harness proves the erasure suite against.
 *
 * It owns two demo stores: `demo_profiles`, scoped by organisation, and
 * `demo_links`, global. It also owns one cache entry, reported as `cache:demo`. `$defect` switches on one
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

    /** True scopes the `demo_archive` connection by organisation too, as the fixture's `isArchiveScoped` declares. */
    public static bool $isArchiveScoped = false;

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
        if (in_array(self::$defect, ['log_identifier_on_invalid_input', 'log_identifier_on_unsupported_scope'], true) && $identifiers !== []) {
            Log::info('Erasure requested for '.$identifiers[0]);
        }

        $this->validate($userPublicId, $mode, $publicIds, $identifiers);

        if ($organisationId !== null && ! self::$isOrganisationScopeSupported) {
            throw new OrganisationScopeUnsupportedException('This store cannot filter erasures by organisation.');
        }

        $isDeleting = $mode === self::DELETE;
        $isScopedRunSkipped = $organisationId !== null
            && (self::$defect === 'ignore_scoped_runs' || (self::$defect === 'org_anonymise_noop' && ! $isDeleting));

        if ($isScopedRunSkipped) {
            return new ErasureReport('qiick/demo', $mode, $dryRun, [
                'demo_profiles' => $this->counts(0, $isDeleting, 0, null),
                'demo_links' => $this->counts(0, $isDeleting, 0, null),
                'cache:demo' => $this->counts(0, true, 0, null),
                'disk:demo' => $this->counts(0, true, 0, null),
                'connection:demo_archive' => $this->counts(0, $isDeleting, 0, null),
            ]);
        }

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
        $cacheKey = "demo:{$userPublicId}";
        $cacheCount = Cache::has($cacheKey) ? 1 : 0;
        $avatarPath = "avatars/{$userPublicId}.txt";
        $avatarCount = Storage::disk('demo')->exists($avatarPath) ? 1 : 0;
        $isGlobalRun = $organisationId === null;
        $isArchiveInScope = $isGlobalRun || (self::$isArchiveScoped && self::$defect !== 'skip_scoped_archive');
        $archiveEntries = fn (): Builder => DB::connection('demo_archive')->table('demo_archive_entries')
            ->whereIn('owner_public_id', [$userPublicId, ...$publicIds])
            ->when($organisationId !== null && $isArchiveInScope, fn (Builder $query): Builder => $query->where('organisation_id', $organisationId));
        $archiveCount = $archiveEntries()->count();

        $stores = [
            'demo_profiles' => $this->counts($profileCount, $isDeleting, $phantomChange, null),
            'demo_links' => $isLinksInScope
                ? $this->counts($linkCount, $isDeleting, 0, null)
                : $this->counts(0, $isDeleting, 0, $linkCount > 0 ? 'outside_organisation_scope' : null, $linkCount),
            // A forgotten cache entry counts as deleted in both modes; the cache is not organisation-scoped.
            'cache:demo' => $organisationId === null
                ? $this->counts($cacheCount, true, 0, null)
                : $this->counts(0, true, 0, $cacheCount > 0 ? 'outside_organisation_scope' : null, $cacheCount),
        ];

        // The disk is not organisation-scoped either; the archive only when declared so.
        $stores['disk:demo'] = $isGlobalRun
            ? $this->counts($avatarCount, true, 0, null)
            : $this->counts(0, true, 0, $avatarCount > 0 ? 'outside_organisation_scope' : null, $avatarCount);
        $stores['connection:demo_archive'] = $isArchiveInScope
            ? $this->counts($archiveCount, $isDeleting, 0, null)
            : $this->counts(0, $isDeleting, 0, $archiveCount > 0 ? 'outside_organisation_scope' : null, $archiveCount);

        if (self::$defect === 'omit_cache_store') {
            unset($stores['cache:demo']);
        }

        if (self::$defect === 'keep_email_kept' && $profileCount > 0) {
            $stores['demo_profiles'] = ['deleted' => 0, 'anonymised' => $isDeleting ? 0 : $profileCount, 'kept' => $profileCount, 'reason' => 'legal_obligation'];
        }

        if (self::$defect === 'keep_email_cleartext') {
            $stores['cleartext:demo_profiles.email'] = $this->counts(0, true, 0, $isDeleting || $profileCount === 0 ? null : 'legal_obligation', $isDeleting ? 0 : $profileCount);
        }

        $report = new ErasureReport('qiick/demo', $mode, $dryRun, $stores);

        if (self::$defect === 'log_identifier' && $identifiers !== []) {
            Log::info('Erasing '.$identifiers[0]);
        }

        if (self::$defect === 'log_user_id') {
            Log::info("Erasing user {$userId}");
        }

        if (self::$defect === 'log_national_id') {
            Log::info('Erasing a profile', ['national_id' => $profiles()->value('national_id')]);
        }

        if (self::$defect === 'log_identifier_on_dry_run' && $dryRun && $identifiers !== []) {
            Log::info('Would erase '.$identifiers[0]);
        }

        if (self::$defect === 'log_identifier_on_anonymise' && ! $isDeleting && $identifiers !== []) {
            Log::info('Anonymising '.$identifiers[0]);
        }

        if (self::$defect === 'throw_when_empty' && $profileCount + $linkCount === 0) {
            throw new RuntimeException('Nothing to erase.');
        }

        $isDryRunWriting = self::$defect === 'dry_run_writes' || (self::$defect === 'anonymise_dry_run_writes' && ! $isDeleting);

        if ($dryRun && self::$defect === 'dry_run_replaces_avatar' && $avatarCount > 0) {
            Storage::disk('demo')->put($avatarPath, 'replaced by a dry run');
        }

        if ($dryRun && self::$defect === 'dry_run_caches') {
            Cache::put("dry-run:{$userPublicId}", $identifiers[0] ?? '', 3600);
        }

        if (self::$defect === 'log_identifier_when_empty' && $profileCount + $linkCount === 0 && $identifiers !== []) {
            Log::info('Nothing to erase for '.$identifiers[0]);
        }

        if ($dryRun && ! $isDryRunWriting) {
            return $report;
        }

        $writeStores = function () use ($profiles, $links, $profileCount, $linkCount, $isDeleting, $isLinksInScope, $organisationId, $archiveEntries): void {
            if (self::$defect === 'archive_before_primary') {
                $archiveEntries()->delete();
            }

            if (self::$defect === 'copy_email_to_note' && ! $isDeleting) {
                $profiles()->update(['note' => DB::raw('email')]);
            }

            if (self::$defect === 'erase_everyone' || (self::$defect === 'erase_everyone_on_anonymise' && ! $isDeleting)) {
                DB::table('demo_profiles')->delete();
            } elseif ($profileCount > 0 && self::$defect === 'org_scrub_keep_national_id' && $organisationId !== null) {
                $profiles()->update(['user_id' => 'erased', 'email' => null, 'ip_address' => null]);
            } elseif ($profileCount > 0 && $isDeleting && self::$defect === 'tombstone_on_delete') {
                // Compliant: audit evidence kept as a constant tombstone, nothing of the person left.
                $profiles()->update(['user_id' => 'erased', 'email' => null, 'ip_address' => null, 'national_id' => null]);
            } elseif ($profileCount > 0 && $isDeleting) {
                $profiles()->delete();
            } elseif ($profileCount > 0) {
                $scrubbedColumns = ['user_id' => 'erased', 'email' => null, 'ip_address' => null, 'national_id' => null, 'anonymised_at' => now()];
                $keptColumns = match (self::$defect) {
                    'keep_email', 'keep_email_kept', 'keep_email_cleartext' => ['email' => true],
                    'keep_national_id' => ['national_id' => true],
                    default => [],
                };
                $profiles()->update(array_diff_key($scrubbedColumns, $keptColumns));
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

        if (self::$defect === 'event_before_writes') {
            event(new SubjectErasedEvent($report));
        }

        if (self::$defect === 'no_transaction' || (self::$defect === 'anonymise_without_transaction' && ! $isDeleting)) {
            $writeStores();
        } elseif (self::$defect === 'swallow_failure') {
            try {
                DB::transaction($writeStores);
            } catch (Throwable) {
                // The defect: the failure is hidden from the caller.
            }
        } else {
            DB::transaction($writeStores);
        }

        // Stores outside the package's transaction follow only once it commits.
        DB::afterCommit(function () use ($cacheKey, $report, $isGlobalRun, $isArchiveInScope, $avatarPath, $archiveEntries, $isDeleting): void {
            $isCacheKept = self::$defect === 'keep_cache' || (self::$defect === 'keep_cache_on_anonymise' && ! $isDeleting);

            if (self::$defect === 'cache_audit_email' && Cache::has($cacheKey)) {
                Cache::put("demo-audit:{$cacheKey}", Cache::get($cacheKey), 3600);
            }

            if ($isGlobalRun && ! $isCacheKept) {
                Cache::forget($cacheKey);
            }

            if ($isGlobalRun && self::$defect !== 'keep_files') {
                Storage::disk('demo')->delete($avatarPath);
            }

            if ($isArchiveInScope && self::$defect !== 'keep_archive') {
                $scrubbedArchive = match (self::$defect) {
                    'keep_dossier' => ['owner_public_id' => 'erased', 'email' => null],
                    'append_to_dossier' => ['owner_public_id' => 'erased', 'email' => null, 'dossier' => DB::raw("dossier || '|erased'")],
                    default => ['owner_public_id' => 'erased', 'email' => null, 'dossier' => null],
                };
                $isDeleting ? $archiveEntries()->delete() : $archiveEntries()->update($scrubbedArchive);
            }

            $isEventSkipped = (self::$defect === 'skip_event_when_empty' && $report->changed() === 0)
                || (self::$defect === 'skip_event_on_anonymise' && ! $isDeleting);

            if (! $isEventSkipped && ! in_array(self::$defect, ['event_inside_transaction', 'event_before_writes'], true)) {
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
            if (self::$defect === 'trim_before_type_check' && trim($identifier) === '') {
                throw new InvalidArgumentException('Every identifier must be a non-empty string.');
            }

            if (! is_string($identifier) && self::$defect === 'echo_non_string_identifier') {
                throw new InvalidArgumentException("Invalid identifier: {$identifier}");
            }

            if (! is_string($identifier)) {
                throw new InvalidArgumentException('Every identifier must be a non-empty string.');
            }

            $isBlank = self::$defect === 'accept_blank_identifier' ? $identifier === '' : trim($identifier) === '';

            if ($isBlank) {
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
