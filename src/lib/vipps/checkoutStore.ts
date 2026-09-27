import 'server-only'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getPostgresClient } from '@/lib/db/getPostgresClient'
import type { VippsConfig } from './config'

export const checkoutStateSchema = z.object({
  handle: z.string(),
  variantId: z.string(),
  stage: z.enum([
    'new',
    'draft_creating',
    'draft_ready',
    'payment_creating',
    'payment_ready',
    'paid',
    'terminal'
  ]),
  termsAcceptedAt: z.string(),
  amount: z.number().int().positive().optional(),
  shippingAmount: z.number().int().nonnegative().optional(),
  draftId: z.string().optional(),
  redirectUrl: z.string().optional(),
  paymentRequest: z.record(z.string(), z.unknown()).optional(),
  order: z
    .object({ id: z.string(), name: z.string() })
    .optional(),
  lastError: z.string().optional()
})
export type VippsCheckoutState = z.infer<
  typeof checkoutStateSchema
>

// postgres serializers may return JSONB either as an object or as its JSON text.
// Normalize at the storage boundary so orchestration never depends on driver mode.
export function parseVippsCheckoutState(value: unknown) {
  return checkoutStateSchema.parse(
    typeof value === 'string' ? JSON.parse(value) : value
  )
}

export async function withVippsCheckout<T>(
  config: VippsConfig,
  reference: string,
  operation: (
    state: VippsCheckoutState,
    save: (state: VippsCheckoutState) => Promise<void>
  ) => Promise<T>,
  initial?: VippsCheckoutState
) {
  const client = getPostgresClient()
  if (!client)
    throw new Error('Vipps durable storage is unavailable')
  const sql = client
  if (initial) {
    await sql`insert into private.vipps_express_checkouts (environment,msn,reference,state)
      values (${config.environment},${config.msn},${reference},${JSON.stringify(checkoutStateSchema.parse(initial))}::jsonb) on conflict do nothing`
  }
  const owner = randomUUID()
  const rows =
    await sql`update private.vipps_express_checkouts set lease_owner=${owner},lease_until=now()+interval '120 seconds'
    where environment=${config.environment} and msn=${config.msn} and reference=${reference}
    and (lease_until is null or lease_until<now()) returning state`
  if (!rows[0])
    throw new Error(
      'Vipps checkout is unavailable or being processed'
    )
  async function save(next: VippsCheckoutState) {
    const parsed = checkoutStateSchema.parse(next)
    const updated =
      await sql`update private.vipps_express_checkouts set state=${JSON.stringify(parsed)}::jsonb,updated_at=now()
      where environment=${config.environment} and msn=${config.msn} and reference=${reference}
      and lease_owner=${owner} and lease_until>now() returning reference`
    if (!updated[0]) throw new Error('Vipps checkout lease lost')
  }
  try {
    return await operation(
      parseVippsCheckoutState(rows[0].state),
      save
    )
  } finally {
    await sql`update private.vipps_express_checkouts set lease_owner=null,lease_until=null
      where environment=${config.environment} and msn=${config.msn} and reference=${reference} and lease_owner=${owner}`
  }
}
