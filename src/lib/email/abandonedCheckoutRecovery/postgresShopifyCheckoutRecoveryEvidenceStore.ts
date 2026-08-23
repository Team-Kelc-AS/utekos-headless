import 'server-only'

import { createHash } from 'node:crypto'

import { getPostgresClient } from '@/lib/db/getPostgresClient'

import type { ProtectedShopifyCheckoutRecoveryEvidence } from './shopifyCheckoutRecoveryEvidenceContract'
import type { ShopifyCheckoutRecoveryEvidenceStore } from './shopifyCheckoutRecoveryEvidenceStore'

function getTrackingSql() {
  const sql = getPostgresClient()

  if (!sql) {
    throw new Error('Missing tracking database connection string')
  }

  return sql
}

function createIdempotencyKey(
  evidence: ProtectedShopifyCheckoutRecoveryEvidence
) {
  return [
    evidence.contract,
    evidence.schemaVersion,
    evidence.source,
    evidence.eventName,
    evidence.eventId
  ].join(':')
}

export const postgresShopifyCheckoutRecoveryEvidenceStore:
  ShopifyCheckoutRecoveryEvidenceStore = {
    persist: async evidence => {
      const sql = getTrackingSql()
      const idempotencyKey = createIdempotencyKey(evidence)
      const payloadSha256 = createHash('sha256')
        .update(JSON.stringify(evidence), 'utf8')
        .digest('hex')
      const expiresAt = new Date(
        Date.parse(evidence.occurredAt)
        + 8 * 24 * 60 * 60 * 1000
      ).toISOString()

      const rows = await sql`
        insert into ops.shopify_checkout_recovery_evidence (
          idempotency_key,
          payload_sha256,
          contract_name,
          schema_version,
          source,
          verification_status,
          event_id,
          event_name,
          event_sequence,
          occurred_at,
          checkout_token,
          begin_checkout_event_id,
          recipient_fingerprint,
          buyer_accepts_email_marketing,
          buyer_accepts_sms_marketing,
          has_contact_phone,
          has_first_name,
          has_last_name,
          has_address1,
          has_address2,
          has_city,
          has_country_code,
          has_postal_code,
          has_shipping_phone,
          expires_at
        ) values (
          ${idempotencyKey},
          ${payloadSha256},
          ${evidence.contract},
          ${evidence.schemaVersion},
          ${evidence.source},
          ${evidence.verificationStatus},
          ${evidence.eventId},
          ${evidence.eventName},
          ${evidence.eventSequence},
          ${evidence.occurredAt},
          ${evidence.checkoutToken},
          ${evidence.beginCheckoutEventId},
          ${evidence.recipientFingerprint},
          ${evidence.buyerAcceptsEmailMarketing},
          ${evidence.buyerAcceptsSmsMarketing},
          ${evidence.fieldPresence.contactPhone},
          ${evidence.fieldPresence.firstName},
          ${evidence.fieldPresence.lastName},
          ${evidence.fieldPresence.address1},
          ${evidence.fieldPresence.address2},
          ${evidence.fieldPresence.city},
          ${evidence.fieldPresence.countryCode},
          ${evidence.fieldPresence.postalCode},
          ${evidence.fieldPresence.shippingPhone},
          ${expiresAt}
        )
        on conflict (idempotency_key) do update
        set
          observation_count =
            ops.shopify_checkout_recovery_evidence.observation_count + 1,
          last_observed_at = statement_timestamp(),
          updated_at = statement_timestamp()
        where
          ops.shopify_checkout_recovery_evidence.payload_sha256 =
            excluded.payload_sha256
        returning observation_count
      `

      const observationCount = rows[0]?.observation_count

      if (observationCount === undefined) {
        return { status: 'conflict', observationCount: 1 }
      }

      if (
        typeof observationCount !== 'number'
        || !Number.isInteger(observationCount)
        || observationCount < 1
      ) {
        throw new Error('Invalid checkout recovery evidence replay count')
      }

      return {
        status: observationCount === 1 ? 'inserted' : 'duplicate',
        observationCount
      }
    }
  }
