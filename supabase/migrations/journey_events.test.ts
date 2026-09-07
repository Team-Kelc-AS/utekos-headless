import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('journey retention and grants keep raw behavior private and consented', async () => {
  const sql = await readFile(new URL('./20260906172240_add_consented_journey_events.sql', import.meta.url), 'utf8')
  assert.match(sql, /event_id uuid primary key/)
  assert.match(sql, /consent ->> 'analytics' = 'granted'/)
  assert.match(sql, /alter table ops.journey_events force row level security/)
  assert.match(sql, /revoke all on table ops.journey_events from public, anon, authenticated, service_role/)
  assert.match(sql, /grant select, insert on table ops.journey_events to service_role/)
  assert.match(sql, /interval '14 months' \+ interval '1 hour'/)
  assert.match(sql, /'purge_expired_journey_events', '17 \* \* \* \*'/)
  assert.doesNotMatch(sql, /grant.*(?:anon|authenticated)/)
})
