import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260822095000_shopify_checkout_recovery_evidence.sql',
  import.meta.url
)

test('recovery evidence migration stores fingerprints, not raw PII', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(
    sql,
    /recipient_fingerprint text not null[\s\S]*buyer_accepts_email_marketing boolean not null/u
  )
  assert.doesNotMatch(
    sql,
    /\b(email_address|first_name|last_name|address_line|phone_number)\b/u
  )
  assert.match(
    sql,
    /expires_at <= occurred_at \+ interval '8 days'/u
  )
  assert.match(
    sql,
    /enable row level security[\s\S]*revoke all[\s\S]*from public, anon, authenticated/u
  )
})

test('recovery evidence supports exact newest checkout/email lookup', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(
    sql,
    /begin_checkout_event_id,[\s\S]*recipient_fingerprint,[\s\S]*event_sequence desc,[\s\S]*occurred_at desc/u
  )
  assert.match(
    sql,
    /shopify_checkout_recovery_verified_match_idx[\s\S]*source = 'shopify_checkouts_update_webhook'[\s\S]*verification_status = 'shopify_hmac_verified'/u
  )
})
