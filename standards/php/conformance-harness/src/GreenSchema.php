<?php

declare(strict_types=1);

namespace Qiick\ConformanceHarness;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Builds a deliberately correct minimal fleet schema for GREEN proofs.
 */
final class GreenSchema
{
    public static function migrate(): void
    {
        Schema::dropAllTables();

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('username')->nullable()->unique();
            $table->string('email')->unique();
            $table->string('locale')->default('en');
            $table->string('timezone')->default('UTC');
            $table->string('password')->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('last_login_at')->nullable();
            $table->string('last_login_ip')->nullable();
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('organisations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('organisation_user', function (Blueprint $table): void {
            $table->uuid('organisation_id');
            $table->foreignId('user_id');
            $table->unique(['organisation_id', 'user_id']);
        });

        Schema::create('user_identities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->index()->constrained('users')->cascadeOnDelete();

            if (Schema::getConnection()->getDriverName() === 'mysql'
                || Schema::getConnection()->getDriverName() === 'mariadb') {
                // utf8mb4_bin so MySQL UNIQUE(issuer, subject) is case-sensitive like PostgreSQL.
                $table->string('issuer')->charset('utf8mb4')->collation('utf8mb4_bin');
                $table->string('subject')->charset('utf8mb4')->collation('utf8mb4_bin');
            } else {
                $table->string('issuer');
                $table->string('subject');
            }

            $table->timestamps();
            $table->unique(['issuer', 'subject']);
        });

        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('guard_name');
            $table->uuid('organisation_id')->nullable();
            $table->timestamps();
            // Spatie teams-on shape: unique per organisation + name + guard.
            $table->unique(['organisation_id', 'name', 'guard_name']);
        });

        Schema::create('permissions', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();
            $table->unique(['name', 'guard_name']);
        });

        Schema::create('model_has_roles', function (Blueprint $table): void {
            $table->unsignedBigInteger('role_id');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->uuid('organisation_id')->nullable();
        });

        Schema::create('model_has_permissions', function (Blueprint $table): void {
            $table->unsignedBigInteger('permission_id');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->uuid('organisation_id')->nullable();
        });

        Schema::create('role_has_permissions', function (Blueprint $table): void {
            $table->unsignedBigInteger('permission_id');
            $table->unsignedBigInteger('role_id');
        });

        // laravel-access package shape (§2.4–2.6 + AC17): public_id / metadata /
        // expires_at, nullable organisation_id, is_instance, XOR constraint.
        Schema::create('user_groups', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->uuid('organisation_id')->nullable()->index();
            $table->boolean('is_instance')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        self::addUserGroupsInstanceOrganisationXorConstraint();

        Schema::create('user_group_user', function (Blueprint $table): void {
            $table->foreignId('user_group_id');
            $table->foreignId('user_id')->index();
            $table->dateTime('expires_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['user_group_id', 'user_id']);
        });

        Schema::create('user_group_role', function (Blueprint $table): void {
            $table->foreignId('user_group_id');
            $table->foreignId('role_id')->index();
            $table->timestamps();
            $table->unique(['user_group_id', 'role_id']);
        });

        Schema::create('principals', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('type');
            // nullOnDelete: the principal row stays for audit (core-hardening).
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            // Decision 2026-11-22: NOT NULL when the product has organisations.
            $table->uuid('organisation_id');
            $table->string('name')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();
        });

        Schema::create('api_keys', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('key_prefix', 32);
            $table->string('key_hash', 64)->unique();
            $table->uuid('owner_principal_id')->index();
            $table->foreign('owner_principal_id')->references('id')->on('principals')->restrictOnDelete();
            $table->foreignId('created_by')->nullable()->index()->constrained('users')->nullOnDelete();
            $table->json('scopes');
            $table->json('ip_allowlist')->nullable();
            $table->unsignedInteger('rate_limit_per_minute')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->dateTime('previous_key_valid_until')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->string('last_used_ip')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });

        Schema::create('activity_log', function (Blueprint $table): void {
            $table->id();
            $table->string('log_name')->nullable();
            $table->text('description');
            $table->string('subject_type')->nullable();
            $table->string('subject_id', 64)->nullable();
            $table->string('causer_type')->nullable();
            $table->string('causer_id', 64)->nullable();
            $table->uuid('organisation_id')->nullable()->index();
            $table->json('properties')->nullable();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table): void {
            $table->id();
            // Widths stay under MySQL's utf8mb4 unique-key byte limit.
            $table->string('scope', 32);
            $table->string('scope_id', 36);
            $table->string('group', 64);
            $table->string('key', 128);
            $table->text('value')->nullable();
            $table->timestamps();
            $table->unique(['scope', 'scope_id', 'group', 'key']);
            $table->index(['scope', 'scope_id', 'group']);
        });

        Schema::create('sessions', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable();
            $table->text('payload');
            $table->integer('last_activity');
        });

        Schema::create('notifications', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('passkeys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('authenticatable_id');
            $table->string('name');
            $table->text('credential_id');
            $table->text('public_key');
            $table->timestamps();
        });
    }

    /**
     * Mirrors qiick/laravel-access create_user_groups: is_instance=true only with
     * organisation_id NULL (SQLite triggers; CHECK on MySQL / MariaDB / PostgreSQL).
     */
    public static function addUserGroupsInstanceOrganisationXorConstraint(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement(
                'CREATE TRIGGER user_groups_instance_org_xor_insert
                 BEFORE INSERT ON user_groups
                 FOR EACH ROW
                 WHEN NEW.is_instance = 1 AND NEW.organisation_id IS NOT NULL
                 BEGIN
                     SELECT RAISE(ABORT, \'is_instance requires null organisation_id\');
                 END',
            );
            DB::statement(
                'CREATE TRIGGER user_groups_instance_org_xor_update
                 BEFORE UPDATE ON user_groups
                 FOR EACH ROW
                 WHEN NEW.is_instance = 1 AND NEW.organisation_id IS NOT NULL
                 BEGIN
                     SELECT RAISE(ABORT, \'is_instance requires null organisation_id\');
                 END',
            );

            return;
        }

        $expression = in_array($driver, ['mysql', 'mariadb'], true)
            ? '(is_instance = 0 OR organisation_id IS NULL)'
            : '(is_instance = false OR organisation_id IS NULL)';

        DB::statement(
            "ALTER TABLE user_groups ADD CONSTRAINT user_groups_instance_org_xor CHECK {$expression}",
        );
    }
}
