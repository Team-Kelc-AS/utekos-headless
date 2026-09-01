import 'server-only'

import { z } from 'zod'

import {
  createSupabaseAdminClient
} from '@/lib/supabase/server'

import type {
  Database,
  Json
} from '@/types/supabase/database.types'

import {
  toAbandonedCheckoutRecoveryDispatchInsert,
  type AbandonedCheckoutRecoveryDispatchPlan
} from './abandonedCheckoutRecovery'

const AffectedCountSchema =
  z.union([
    z
      .number()
      .int()
      .nonnegative(),

    z
      .string()
      .regex(/^\d+$/)
      .transform(value =>
        Number(value)
      )
  ])

type JsonObject = {
  [key: string]:
    | Json
    | undefined
}

type UpsertRpcResult = {
  data: unknown

  error:
    | {
        message?: string
      }
    | null
}

export type UpsertAbandonedCheckoutRecoveryDispatchesResult = {
  submitted: number
  affected: number
  unchanged: number
}

export type UpsertAbandonedCheckoutRecoveryDispatchesDependencies = {
  executeUpsertRpc?: (
    rows: Json
  ) => Promise<UpsertRpcResult>
}

function getPlanKey(
  plan:
    AbandonedCheckoutRecoveryDispatchPlan
): string {
  return [
    plan.shopifyAbandonedCheckoutId,
    plan.sequenceVersion,
    plan.step
  ].join(':')
}

function assertUniquePlanKeys(
  plans:
    readonly AbandonedCheckoutRecoveryDispatchPlan[]
): void {
  const keys =
    new Set<string>()

  for (const plan of plans) {
    const key =
      getPlanKey(plan)

    if (keys.has(key)) {
      throw new Error(
        'abandoned_checkout_recovery_duplicate_plan_key'
      )
    }

    keys.add(key)
  }
}

/**
 * Explicitly construct the RPC payload instead of forwarding
 * arbitrary objects.
 *
 * This gives this module a hard PII/data-minimisation boundary:
 * no email, recovery URL, customer payload, address, line items,
 * cookies or arbitrary Shopify response can cross it.
 */
function toRpcRow(
  plan:
    AbandonedCheckoutRecoveryDispatchPlan
): JsonObject {
  const row =
    toAbandonedCheckoutRecoveryDispatchInsert(
      plan
    )

  return {
    shopify_abandoned_checkout_id:
      row.shopify_abandoned_checkout_id,

    shopify_customer_id:
      row.shopify_customer_id,

    sequence_version:
      row.sequence_version,

    step:
      row.step,

    checkout_created_at:
      row.checkout_created_at,

    checkout_updated_at:
      row.checkout_updated_at,

    due_at:
      row.due_at,

    next_attempt_at:
      row.next_attempt_at,

    status:
      row.status,

    suppression_reason:
      row.suppression_reason,

    suppressed_at:
      row.suppressed_at
  }
}

async function executeDefaultUpsertRpc(
  rows: Json
): Promise<UpsertRpcResult> {
  const adminClient =
    createSupabaseAdminClient<
      Database
    >()

  const {
    data,
    error
  } =
    await adminClient
      .schema('ops')
      .rpc(
        'upsert_abandoned_checkout_recovery_dispatches',
        {
          p_rows:
            rows
        }
      )

  return {
    data,
    error
  }
}

export async function upsertAbandonedCheckoutRecoveryDispatches(
  plans:
    readonly AbandonedCheckoutRecoveryDispatchPlan[],
  dependencies:
    UpsertAbandonedCheckoutRecoveryDispatchesDependencies = {}
): Promise<
  UpsertAbandonedCheckoutRecoveryDispatchesResult
> {
  if (plans.length === 0) {
    return {
      submitted: 0,
      affected: 0,
      unchanged: 0
    }
  }

  assertUniquePlanKeys(
    plans
  )

  const rows:
    Json =
    plans.map(
      toRpcRow
    )

  const executeUpsertRpc =
    dependencies.executeUpsertRpc
    ?? executeDefaultUpsertRpc

  const {
    data,
    error
  } =
    await executeUpsertRpc(
      rows
    )

  if (error) {
    /**
     * Never propagate raw Postgres/PostgREST errors.
     *
     * Upstream errors may contain values or implementation
     * details that should not reach Vercel logs or
     * an HTTP response.
     */
    throw new Error(
      'abandoned_checkout_recovery_persist_failed'
    )
  }

  const affectedResult =
    AffectedCountSchema.safeParse(
      data
    )

  if (!affectedResult.success) {
    throw new Error(
      'abandoned_checkout_recovery_persist_result_invalid'
    )
  }

  const affected =
    affectedResult.data

  if (
    affected
    > plans.length
  ) {
    throw new Error(
      'abandoned_checkout_recovery_persist_count_invalid'
    )
  }

  return {
    submitted:
      plans.length,

    affected,

    unchanged:
      plans.length
      - affected
  }
}
