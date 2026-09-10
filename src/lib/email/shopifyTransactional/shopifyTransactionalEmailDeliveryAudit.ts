import 'server-only'

import { z } from 'zod'

import { getPostgresClient } from '@/lib/db/getPostgresClient'

import { shopifyTransactionalEmailNotificationTypes } from './shopifyTransactionalEmailEvidenceContract'

const idempotencyKeySchema = z.string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9_./:-]{0,254}$/u)
const resendEmailIdSchema = z.string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$/u)
const orderIdSchema = z.string()
  .regex(/^gid:\/\/shopify\/Order\/[1-9][0-9]{0,19}$/u)
const fulfillmentIdSchema = z.string()
  .regex(/^gid:\/\/shopify\/Fulfillment\/[1-9][0-9]{0,19}$/u)

function requireTrackingSql() {
  const sql = getPostgresClient()

  if (!sql) {
    throw new Error(
      'shopify_transactional_email_database_unavailable'
    )
  }

  return sql
}

export async function hasShopifyTransactionalEmailDelivery(
  idempotencyKey: string
): Promise<boolean> {
  const parsedKey = idempotencyKeySchema.safeParse(idempotencyKey)

  if (!parsedKey.success) {
    throw new Error(
      'shopify_transactional_email_idempotency_key_invalid'
    )
  }

  const sql = requireTrackingSql()
  const rows = await sql`
    select resend_email_id
    from ops.shopify_transactional_email_deliveries
    where idempotency_key = ${parsedKey.data}
    limit 1
  `

  return rows.length === 1
}

export async function recordShopifyTransactionalEmailDelivery(
  input: {
    idempotencyKey: string
    notificationType: typeof shopifyTransactionalEmailNotificationTypes[number]
    shopifyOrderId: string
    shopifyFulfillmentId: string | null
    resendEmailId: string
    sentAt?: Date
  }
): Promise<void> {
  const parsed = z.strictObject({
    idempotencyKey: idempotencyKeySchema,
    notificationType: z.enum(
      shopifyTransactionalEmailNotificationTypes
    ),
    shopifyOrderId: orderIdSchema,
    shopifyFulfillmentId: fulfillmentIdSchema.nullable(),
    resendEmailId: resendEmailIdSchema,
    sentAt: z.date()
  }).safeParse({
    ...input,
    sentAt: input.sentAt ?? new Date()
  })

  if (!parsed.success || !Number.isFinite(parsed.data?.sentAt.getTime())) {
    throw new Error(
      'shopify_transactional_email_delivery_audit_input_invalid'
    )
  }

  const sql = requireTrackingSql()
  const rows = await sql`
    insert into ops.shopify_transactional_email_deliveries (
      idempotency_key,
      notification_type,
      shopify_order_id,
      shopify_fulfillment_id,
      resend_email_id,
      sent_at,
      expires_at
    ) values (
      ${parsed.data.idempotencyKey},
      ${parsed.data.notificationType},
      ${parsed.data.shopifyOrderId},
      ${parsed.data.shopifyFulfillmentId},
      ${parsed.data.resendEmailId},
      ${parsed.data.sentAt.toISOString()},
      ${new Date(
        parsed.data.sentAt.getTime()
        + 14 * 30 * 24 * 60 * 60 * 1000
      ).toISOString()}
    )
    on conflict (idempotency_key) do nothing
    returning resend_email_id
  `

  if (rows.length === 1) {
    return
  }

  const existing = await sql`
    select
      notification_type,
      shopify_order_id,
      shopify_fulfillment_id,
      resend_email_id
    from ops.shopify_transactional_email_deliveries
    where idempotency_key = ${parsed.data.idempotencyKey}
    limit 1
  `
  const row = existing[0]

  if (
    row?.notification_type !== parsed.data.notificationType
    || row?.shopify_order_id !== parsed.data.shopifyOrderId
    || (row?.shopify_fulfillment_id ?? null)
      !== parsed.data.shopifyFulfillmentId
    || row?.resend_email_id !== parsed.data.resendEmailId
  ) {
    throw new Error(
      'shopify_transactional_email_delivery_audit_conflict'
    )
  }
}
