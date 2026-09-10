#!/bin/bash
set -eo pipefail
umask 077

cd /Users/kristofferohnstadhjelmeland/utekos-headless
source "$HOME/.nvm/nvm.sh"
nvm use --silent
set -u
unset PGHOST PGHOSTADDR PGPORT PGDATABASE PGUSER PGPASSWORD PGPASSFILE PGSERVICE PGSERVICEFILE PGOPTIONS

pg_bin=/opt/homebrew/opt/postgresql@17/bin
pg_source_commit=5cedfa472ccc83567aa23ec645925ed8489a7797
test_root=$(mktemp -d /tmp/utekos-consent-db.XXXXXX)
output_root=$(mktemp -d "$PWD/work/consent-database.XXXXXX")
server_started=false
overall_status=0

finish() {
  result=$?
  if [ "$server_started" = true ]; then
    if ! "$pg_bin/pg_ctl" -D "$test_root/data" -m fast -w -t 20 stop > "$output_root/stop.log" 2>&1; then
      result=1
      printf 'Local test server shutdown failed; inspect %s\n' "$output_root/stop.log"
    fi
  fi
  printf 'test_directory=%s\nevidence_directory=%s\nexit=%s\n' "$test_root" "$output_root" "$result"
  exit "$result"
}
trap finish EXIT

"$pg_bin/postgres" --version
test "$(git branch --show-current)" = main
git rev-parse HEAD > "$output_root/baseline-sha.txt"

cron_control="$("$pg_bin/pg_config" --sharedir)/extension/pg_cron.control"
if [ ! -f "$cron_control" ]; then
  test ! -e "$("$pg_bin/pg_config" --pkglibdir)/pg_cron.so"
  test ! -e "$("$pg_bin/pg_config" --pkglibdir)/pg_cron.dylib"
  git clone --depth 1 --branch v1.6.8 https://github.com/citusdata/pg_cron.git "$test_root/pg_cron" > "$output_root/pg-cron-source.log" 2>&1
  test "$(git -C "$test_root/pg_cron" rev-parse HEAD)" = "$pg_source_commit"
  make -C "$test_root/pg_cron" PG_CONFIG="$pg_bin/pg_config" PG_LDFLAGS=-lintl -j2 > "$output_root/pg-cron-build.log" 2>&1
  make -C "$test_root/pg_cron" PG_CONFIG="$pg_bin/pg_config" PG_LDFLAGS=-lintl install > "$output_root/pg-cron-install.log" 2>&1
fi

"$pg_bin/initdb" -D "$test_root/data" -U consent_test_admin --encoding=UTF8 --locale=C --auth-local=trust --auth-host=reject > "$output_root/initdb.log" 2>&1
server_options="-h '' -p 58527 -k $test_root -c shared_preload_libraries=pg_cron -c cron.database_name=postgres -c cron.launch_active_jobs=off -c cron.use_background_workers=on -c utekos.consent_test=isolated"
"$pg_bin/pg_ctl" -D "$test_root/data" -l "$output_root/postgres.log" -o "$server_options" -w -t 20 start > "$output_root/start.log" 2>&1
server_started=true

if ! corepack pnpm exec tsx scripts/consent/operational-database-smoke.ts "$test_root" "$output_root" > "$output_root/tests.log" 2>&1; then
  overall_status=1
fi

lint_url="postgresql://consent_test_admin@/postgres?host=$test_root&port=58527&sslmode=disable"
if ! corepack pnpm exec supabase db lint --db-url "$lint_url" --schema ops --level warning --fail-on error --output json > "$output_root/supabase-lint.log" 2>&1; then
  overall_status=1
fi

"$pg_bin/pg_ctl" -D "$test_root/data" -m fast -w -t 20 restart > "$output_root/restart.log" 2>&1
if ! corepack pnpm exec tsx scripts/consent/operational-database-smoke.ts "$test_root" "$output_root" readback > "$output_root/restart-readback.log" 2>&1; then
  overall_status=1
fi
if ! corepack pnpm exec eslint scripts/consent/operational-database-smoke.ts > "$output_root/test-harness-lint.log" 2>&1; then
  overall_status=1
fi
if ! corepack pnpm run typecheck > "$output_root/typecheck.log" 2>&1; then
  overall_status=1
fi
exit "$overall_status"
