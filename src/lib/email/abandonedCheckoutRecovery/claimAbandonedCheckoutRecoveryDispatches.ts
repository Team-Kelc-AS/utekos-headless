import { z } from 'zod'

import type {
  Database
} from '@/types/supabase/database.types'

import type {
  ClaimedAbandonedCheckoutRecoveryDispatch
} from './abandonedCheckoutRecoveryDispatch'

type ClaimRpcArgs = {
  p_processing_owner: string
  p_limit: number
  p_lease_seconds: number
  p_now: string
}

type ClaimRpcRow = {
  id: string
  shopify_abandoned_checkout_id: string
  shopify_customer_id: string
  sequence_version: number
  step: number
  checkout_created_at: string
  checkout_updated_at: string
  due_at: string
  attempt_count: number
  processing_expires_at: string
}

type AbandonedCheckoutRecoveryClaimDatabase =
  Omit<Database, 'ops'> & {
    ops:
      Omit<Database['ops'], 'Functions'> & {
        Functions:
          Database['ops']['Functions'] & {
            claim_abandoned_checkout_recovery_dispatches: {
              Args: ClaimRpcArgs
              Returns: ClaimRpcRow[]
            }
          }
      }
  }

type ClaimRpcResult = {
  data: unknown
  error:
    | {
        message?: string
      }
    | null
}

export type {
  ClaimedAbandonedCheckoutRecoveryDispatch
} from './abandonedCheckoutRecoveryDispatch'

export type ClaimAbandonedCheckoutRecoveryDispatchesInput = {
  workerId: string
  limit?: number
  leaseSeconds?: number
  now?: Date
}

export type ClaimAbandonedCheckoutRecoveryDispatchesDependencies = {
  executeClaimRpc?: (
    args: ClaimRpcArgs
  ) => Promise<ClaimRpcResult>
}

const claimInputSchema = z.strictObject({
  workerId: z
    .string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/),
  limit: z.number().int().min(1).max(25),
  leaseSeconds: z.number().int().min(30).max(900),
  now: z.date()
})

const claimRowSchema = z.strictObject({
  id: z.string().uuid(),
  shopify_abandoned_checkout_id:
    z.string().min(1).max(255),
  shopify_customer_id:
    z.string().min(1).max(255),
  sequence_version: z.number().int().positive(),
  step: z.number().int().positive(),
  checkout_created_at:
    z.string().datetime({ offset: true }),
  checkout_updated_at:
    z.string().datetime({ offset: true }),
  due_at:
    z.string().datetime({ offset: true }),
  attempt_count: z.number().int().nonnegative(),
  processing_expires_at:
    z.string().datetime({ offset: true })
})

const claimRowsSchema = z.array(claimRowSchema)

async function executeDefaultClaimRpc(
  args: ClaimRpcArgs
): Promise<ClaimRpcResult> {
  const {
    createSupabaseAdminClient
  } = await import('@/lib/supabase/server')

  const adminClient =
    createSupabaseAdminClient<
      AbandonedCheckoutRecoveryClaimDatabase
    >()

  const { data, error } =
    await adminClient
      .schema('ops')
      .rpc(
        'claim_abandoned_checkout_recovery_dispatches',
        args
      )

  return { data, error }
}

function toClaim(
  row: z.infer<typeof claimRowSchema>
): ClaimedAbandonedCheckoutRecoveryDispatch {
  return {
    dispatchId: row.id,
    shopifyAbandonedCheckoutId:
      row.shopify_abandoned_checkout_id,
    shopifyCustomerId:
      row.shopify_customer_id,
    sequenceVersion: row.sequence_version,
    step: row.step,
    checkoutCreatedAt: row.checkout_created_at,
    checkoutUpdatedAt: row.checkout_updated_at,
    dueAt: row.due_at,
    attemptCount: row.attempt_count,
    processingExpiresAt:
      row.processing_expires_at
  }
}

export async function claimAbandonedCheckoutRecoveryDispatches(
  input: ClaimAbandonedCheckoutRecoveryDispatchesInput,
  dependencies:
    ClaimAbandonedCheckoutRecoveryDispatchesDependencies = {}
): Promise<ClaimedAbandonedCheckoutRecoveryDispatch[]> {
  const inputResult = claimInputSchema.safeParse({
    workerId: input.workerId,
    limit: input.limit ?? 10,
    leaseSeconds: input.leaseSeconds ?? 120,
    now: input.now ?? new Date()
  })

  if (!inputResult.success) {
    throw new Error(
      'abandoned_checkout_recovery_claim_input_invalid'
    )
  }

  const parsedInput = inputResult.data
  const executeClaimRpc =
    dependencies.executeClaimRpc
    ?? executeDefaultClaimRpc

  let rpcResult: ClaimRpcResult

  try {
    rpcResult = await executeClaimRpc({
      p_processing_owner: parsedInput.workerId,
      p_limit: parsedInput.limit,
      p_lease_seconds: parsedInput.leaseSeconds,
      p_now: parsedInput.now.toISOString()
    })
  } catch {
    throw new Error(
      'abandoned_checkout_recovery_claim_failed'
    )
  }

  if (rpcResult.error) {
    throw new Error(
      'abandoned_checkout_recovery_claim_failed'
    )
  }

  const rowsResult =
    claimRowsSchema.safeParse(rpcResult.data)

  if (!rowsResult.success) {
    throw new Error(
      'abandoned_checkout_recovery_claim_result_invalid'
    )
  }

  return rowsResult.data.map(toClaim)
}
