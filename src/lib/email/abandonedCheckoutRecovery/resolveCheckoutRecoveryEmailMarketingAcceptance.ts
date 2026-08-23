import 'server-only'

import { z } from 'zod'

import { getPostgresClient } from '@/lib/db/getPostgresClient'

import { protectShopifyCheckoutRecoveryEvidenceEmail } from './protectShopifyCheckoutRecoveryEvidenceEmail'

type Query = {
  beginCheckoutEventId: string
  recipientFingerprint: string
  checkoutCreatedAt: string
  now: string
}

type QueryResult = {
  buyerAcceptsEmailMarketing: boolean
} | null

type Dependencies = {
  protectEmail?: (email: string) => string
  queryLatest?: (query: Query) => Promise<QueryResult>
}

const inputSchema = z.strictObject({
  beginCheckoutEventId: z.string().uuid(),
  email: z.email().max(320),
  checkoutCreatedAt: z.string().datetime({ offset: true })
})

async function defaultQueryLatest(query: Query): Promise<QueryResult> {
  const sql = getPostgresClient()

  if (!sql) {
    throw new Error('Missing tracking database connection string')
  }

  const rows = await sql`
    select buyer_accepts_email_marketing
    from ops.shopify_checkout_recovery_evidence
    where begin_checkout_event_id = ${query.beginCheckoutEventId}
      and recipient_fingerprint = ${query.recipientFingerprint}
      and schema_version = 2
      and source = 'shopify_checkouts_update_webhook'
      and verification_status = 'shopify_hmac_verified'
      and event_name = 'checkouts/update'
      and occurred_at >= ${query.checkoutCreatedAt}
      and occurred_at <= ${query.now}
      and expires_at > ${query.now}
    order by occurred_at desc, event_id desc
    limit 1
  `

  const value = rows[0]?.buyer_accepts_email_marketing

  if (value === undefined) {
    return null
  }

  if (typeof value !== 'boolean') {
    throw new Error('checkout_recovery_evidence_state_invalid')
  }

  return { buyerAcceptsEmailMarketing: value }
}

export async function resolveCheckoutRecoveryEmailMarketingAcceptance(
  input: {
    beginCheckoutEventId: string
    email: string
    checkoutCreatedAt: string
    now?: Date
  },
  dependencies: Dependencies = {}
): Promise<boolean> {
  const parsed = inputSchema.safeParse({
    beginCheckoutEventId: input.beginCheckoutEventId,
    email: input.email.trim().toLowerCase(),
    checkoutCreatedAt: input.checkoutCreatedAt
  })
  const now = input.now ?? new Date()

  if (!parsed.success || !Number.isFinite(now.getTime())) {
    throw new Error('checkout_recovery_evidence_lookup_input_invalid')
  }

  const protectEmail =
    dependencies.protectEmail
    ?? protectShopifyCheckoutRecoveryEvidenceEmail
  const recipientFingerprint = protectEmail(parsed.data.email)
  const queryLatest = dependencies.queryLatest ?? defaultQueryLatest
  const latest = await queryLatest({
    beginCheckoutEventId: parsed.data.beginCheckoutEventId,
    recipientFingerprint,
    checkoutCreatedAt: parsed.data.checkoutCreatedAt,
    now: now.toISOString()
  })

  return latest?.buyerAcceptsEmailMarketing === true
}
