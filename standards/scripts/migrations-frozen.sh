#!/usr/bin/env bash
#
# Migrations frozen (qiick standards, from excubia-app #193): migrations are forward-only. A
# migration that exists on `main`, on the latest `v*` tag or in the optional freeze baseline
# `database/migrations/.frozen` must stay byte for byte as it is there: never edited, renamed or
# deleted. A schema change is a new migration.
#
# The baseline lists `<git blob id>  <file>` per migration, frozen before the first tag (an app
# that already has a tag or a `main` needs none). It only grows: compared with the base branch,
# a PR may add lines but never change or drop one. Run by the reusable migrations-frozen.yml.
#
# Usage: scripts/migrations-frozen.sh [base-ref]   (from the repository root, with the tags and
#        origin/main fetched; base-ref is the PR's base branch, e.g. origin/develop)

set -euo pipefail

DIR="database/migrations"
BASELINE="$DIR/.frozen"
BASE_REF="${1:-}"
errors=0

fail() {
    printf 'FAIL: %s\n' "$1" >&2
    errors=$((errors + 1))
}

# The blob of a file in the checked-out tree; empty when the file is gone.
current_blob() {
    if [ -f "$1" ]; then
        git hash-object "$1"
    fi
}

# Every migration of `$1` must be unchanged in the checked-out tree.
compare_with_ref() {
    local ref="$1" mode blob path

    printf '==> Migrations of %s\n' "$ref"

    while read -r mode _ blob path; do
        [ "$mode" = "100644" ] || [ "$mode" = "100755" ] || continue
        case "$path" in *.php) ;; *) continue ;; esac

        local now
        now="$(current_blob "$path")"

        if [ -z "$now" ]; then
            fail "$path exists on $ref and was deleted or renamed: add a new migration instead"
        elif [ "$now" != "$blob" ]; then
            fail "$path exists on $ref and was modified: add a new migration instead"
        fi
    done < <(git ls-tree "$ref" -- "$DIR/")
}

if git rev-parse --verify --quiet origin/main >/dev/null; then
    compare_with_ref origin/main
fi

TAG="$(git tag --list 'v*' --sort=-v:refname | head -n 1)"

if [ -n "$TAG" ]; then
    compare_with_ref "$TAG"
fi

printf '==> Freeze baseline %s\n' "$BASELINE"

[ -f "$BASELINE" ] || printf 'No %s: only main and the latest tag are compared.\n' "$BASELINE"

if [ -f "$BASELINE" ]; then
    while read -r blob path; do
        case "$blob" in '' | '#'*) continue ;; esac

        now="$(current_blob "$path")"

        if [ -z "$now" ]; then
            fail "$path is frozen ($BASELINE) and was deleted or renamed: add a new migration instead"
        elif [ "$now" != "$blob" ]; then
            fail "$path is frozen ($BASELINE) and was modified: add a new migration instead"
        fi
    done < "$BASELINE"

    # The baseline only grows: every line of the base branch's copy is still there.
    if [ -n "$BASE_REF" ] && git cat-file -e "$BASE_REF:$BASELINE" 2>/dev/null; then
        while IFS= read -r line; do
            grep -qxF -- "$line" "$BASELINE" || fail "$BASELINE dropped or changed the line: $line"
        done < <(git show "$BASE_REF:$BASELINE" | grep -v '^#' | grep -v '^$')
    fi
fi

if [ "$errors" -gt 0 ]; then
    printf '\n%d frozen migration(s) touched. Released migrations are forward-only: revert the change and add a new migration (qiick standards, "Contracts: never break them").\n' "$errors" >&2
    exit 1
fi

printf 'Migrations frozen: OK\n'
