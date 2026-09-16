#!/usr/bin/env bash
set -euo pipefail

BASE_SHA="${1:-${VERCEL_GIT_PREVIOUS_SHA:-}}"
HEAD_SHA="${2:-${VERCEL_GIT_COMMIT_SHA:-HEAD}}"

# Preview/dev builds must remain available for validating large refactors.
if [[ "${VERCEL_ENV:-}" != "" && "${VERCEL_ENV}" != "production" ]]; then
  echo "repo-structure-guard: non-production build; continuing"
  exit 1
fi

# No comparable production baseline yet: do not block the deployment.
if [[ -z "${BASE_SHA}" || "${BASE_SHA}" == "0000000000000000000000000000000000000000" ]]; then
  echo "repo-structure-guard: no baseline SHA available; continuing"
  exit 1
fi

ensure_commit() {
  local sha="$1"
  if git cat-file -e "${sha}^{commit}" 2>/dev/null; then
    return 0
  fi

  echo "repo-structure-guard: fetching missing commit ${sha}"
  git fetch --no-tags --depth=1 origin "${sha}" >/dev/null 2>&1 || true
  git cat-file -e "${sha}^{commit}" 2>/dev/null
}

if ! ensure_commit "${BASE_SHA}"; then
  echo "repo-structure-guard: baseline commit ${BASE_SHA} unavailable; continuing"
  exit 1
fi

if ! ensure_commit "${HEAD_SHA}"; then
  echo "repo-structure-guard: head commit ${HEAD_SHA} unavailable; continuing"
  exit 1
fi

BASE_SRC_FILES=$(git ls-tree -r --name-only "${BASE_SHA}" -- src | wc -l | tr -d ' ')
DIFF=$(git diff --name-status -M "${BASE_SHA}" "${HEAD_SHA}" -- src || true)

DELETED=$(printf '%s\n' "${DIFF}" | awk '$1 == "D" { count++ } END { print count+0 }')
RENAMED=$(printf '%s\n' "${DIFF}" | awk '$1 ~ /^R[0-9]+$/ { count++ } END { print count+0 }')
DESTRUCTIVE=$((DELETED + RENAMED))

if [[ "${BASE_SRC_FILES}" -gt 0 ]]; then
  DESTRUCTIVE_PERCENT=$((DESTRUCTIVE * 100 / BASE_SRC_FILES))
else
  DESTRUCTIVE_PERCENT=0
fi

echo "repo-structure-guard: base=${BASE_SHA} head=${HEAD_SHA} src_files=${BASE_SRC_FILES} deleted=${DELETED} renamed=${RENAMED} destructive=${DESTRUCTIVE} (${DESTRUCTIVE_PERCENT}%)"

# Production safety limits. Any one of these blocks the automatic deployment:
# - >=25 actual deletions under src/
# - >=60 deletions + renames under src/
# - >=15% of the prior src/ tree deleted or relocated in one release
if [[ "${DELETED}" -ge 25 || "${DESTRUCTIVE}" -ge 60 || "${DESTRUCTIVE_PERCENT}" -ge 15 ]]; then
  echo "repo-structure-guard: BLOCKED large structural change under src/"
  echo "repo-structure-guard: validate it as a preview and release deliberately instead of auto-promoting from main"
  exit 0
fi

# Vercel ignoreCommand semantics: exit 1 means continue the build.
echo "repo-structure-guard: structural delta is within production limits; continuing"
exit 1
