import { z } from 'zod'

import type {
  Database
} from '@/types/supabase/database.types'

import type {
  AbandonedCheckoutRecoveryPreSendSuppressionReason
} from './authorizeAbandonedCheckoutRecoverySend'

type RenewRpcCall = {
  name:
    'renew_abandoned_checkout_recovery_dispatch_lease'
  args: {
    p_id: string
    p_processing_owner: string
    p_lease_seconds: number
    p_now: string
  }
}

type SuppressRpcCall = {
  name:
    'suppress_abandoned_checkout_recovery_dispatch'
  args: {
    p_id: string
    p_processing_owner: string
    p_suppression_reason:
      AbandonedCheckoutRecoveryPreSendSuppressionReason
    p_now: string
  }
}

type CompleteRpcCall = {
  name:
    'complete_abandoned_checkout_recovery_dispatch'
  args: {
    p_id: string
    p_processing_owner: string
    p_resend_email_id: string
    p_now: string
  }
}

type RetryRpcCall = {
  name:
    'retry_abandoned_checkout_recovery_dispatch'
  args: {
    p_id: string
    p_processing_owner: string
    p_error_code: string
    p_retry_at: string
    p_max_attempts: number
    p_now: string
  }
}

export type AbandonedCheckoutRecoveryTransitionRpcCall =
  | RenewRpcCall
  | SuppressRpcCall
  | CompleteRpcCall
  | RetryRpcCall

type TransitionRpcResult = {
  data: unknown
  error:
    | {
        message?: string
      }
    | null
}

export type AbandonedCheckoutRecoveryTransitionDependencies = {
  executeTransitionRpc?: (
    call: AbandonedCheckoutRecoveryTransitionRpcCall
  ) => Promise<TransitionRpcResult>
}

type AbandonedCheckoutRecoveryTransitionDatabase =
  Omit<Database, 'ops'> & {
    ops:
      Omit<Database['ops'], 'Functions'> & {
        Functions:
          Database['ops']['Functions'] & {
            renew_abandoned_checkout_recovery_dispatch_lease: {
              Args: RenewRpcCall['args']
              Returns: boolean
            }
            suppress_abandoned_checkout_recovery_dispatch: {
              Args: SuppressRpcCall['args']
              Returns: boolean
            }
            complete_abandoned_checkout_recovery_dispatch: {
              Args: CompleteRpcCall['args']
              Returns: boolean
            }
            retry_abandoned_checkout_recovery_dispatch: {
              Args: RetryRpcCall['args']
              Returns: 'pending' | 'failed' | null
            }
          }
      }
  }

const baseInputShape = {
  dispatchId: z.string().uuid(),
  workerId: z
    .string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/),
  now: z.date()
}

const renewInputSchema = z.strictObject({
  ...baseInputShape,
  leaseSeconds: z.number().int().min(30).max(900)
})

const suppressionReasonSchema = z.enum([
  'recovered',
  'customer_has_orders',
  'draft_order_since_abandonment',
  'superseded_by_newer_checkout',
  'inventory_unavailable',
  'shopify_email_already_sent',
  'shopify_email_scheduled',
  'missing_email',
  'invalid_email',
  'not_subscribed'
])

const suppressInputSchema = z.strictObject({
  ...baseInputShape,
  suppressionReason: suppressionReasonSchema
})

const completeInputSchema = z.strictObject({
  ...baseInputShape,
  resendEmailId: z
    .string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$/)
})

const retryInputSchema = z.strictObject({
  ...baseInputShape,
  errorCode: z
    .string()
    .regex(/^[a-z0-9][a-z0-9_:-]{0,127}$/),
  retryAt: z.date(),
  maxAttempts: z.number().int().min(1).max(20)
})

const booleanResultSchema = z.boolean()
const retryResultSchema =
  z.enum(['pending', 'failed']).nullable()

async function executeDefaultTransitionRpc(
  call: AbandonedCheckoutRecoveryTransitionRpcCall
): Promise<TransitionRpcResult> {
  const {
    createSupabaseAdminClient
  } = await import('@/lib/supabase/server')

  const adminClient =
    createSupabaseAdminClient<
      AbandonedCheckoutRecoveryTransitionDatabase
    >()
  const opsClient = adminClient.schema('ops')

  switch (call.name) {
    case 'renew_abandoned_checkout_recovery_dispatch_lease': {
      const { data, error } = await opsClient.rpc(
        call.name,
        call.args
      )
      return { data, error }
    }

    case 'suppress_abandoned_checkout_recovery_dispatch': {
      const { data, error } = await opsClient.rpc(
        call.name,
        call.args
      )
      return { data, error }
    }

    case 'complete_abandoned_checkout_recovery_dispatch': {
      const { data, error } = await opsClient.rpc(
        call.name,
        call.args
      )
      return { data, error }
    }

    case 'retry_abandoned_checkout_recovery_dispatch': {
      const { data, error } = await opsClient.rpc(
        call.name,
        call.args
      )
      return { data, error }
    }
  }
}

async function executeTransition(
  call: AbandonedCheckoutRecoveryTransitionRpcCall,
  dependencies:
    AbandonedCheckoutRecoveryTransitionDependencies,
  resultSchema:
    | typeof booleanResultSchema
    | typeof retryResultSchema
): Promise<unknown> {
  const executeTransitionRpc =
    dependencies.executeTransitionRpc
    ?? executeDefaultTransitionRpc

  let rpcResult: TransitionRpcResult

  try {
    rpcResult = await executeTransitionRpc(call)
  } catch {
    throw new Error(
      'abandoned_checkout_recovery_transition_failed'
    )
  }

  if (rpcResult.error) {
    throw new Error(
      'abandoned_checkout_recovery_transition_failed'
    )
  }

  const result = resultSchema.safeParse(rpcResult.data)

  if (!result.success) {
    throw new Error(
      'abandoned_checkout_recovery_transition_result_invalid'
    )
  }

  return result.data
}

function parseInput<T>(
  schema: z.ZodType<T>,
  input: unknown
): T {
  const result = schema.safeParse(input)

  if (!result.success) {
    throw new Error(
      'abandoned_checkout_recovery_transition_input_invalid'
    )
  }

  return result.data
}

export async function renewAbandonedCheckoutRecoveryDispatchLease(
  input: {
    dispatchId: string
    workerId: string
    leaseSeconds: number
    now: Date
  },
  dependencies:
    AbandonedCheckoutRecoveryTransitionDependencies = {}
): Promise<boolean> {
  const parsed = parseInput(renewInputSchema, input)

  return await executeTransition(
    {
      name:
        'renew_abandoned_checkout_recovery_dispatch_lease',
      args: {
        p_id: parsed.dispatchId,
        p_processing_owner: parsed.workerId,
        p_lease_seconds: parsed.leaseSeconds,
        p_now: parsed.now.toISOString()
      }
    },
    dependencies,
    booleanResultSchema
  ) as boolean
}

export async function suppressAbandonedCheckoutRecoveryDispatch(
  input: {
    dispatchId: string
    workerId: string
    suppressionReason:
      AbandonedCheckoutRecoveryPreSendSuppressionReason
    now: Date
  },
  dependencies:
    AbandonedCheckoutRecoveryTransitionDependencies = {}
): Promise<boolean> {
  const parsed = parseInput(suppressInputSchema, input)

  return await executeTransition(
    {
      name:
        'suppress_abandoned_checkout_recovery_dispatch',
      args: {
        p_id: parsed.dispatchId,
        p_processing_owner: parsed.workerId,
        p_suppression_reason:
          parsed.suppressionReason,
        p_now: parsed.now.toISOString()
      }
    },
    dependencies,
    booleanResultSchema
  ) as boolean
}

export async function completeAbandonedCheckoutRecoveryDispatch(
  input: {
    dispatchId: string
    workerId: string
    resendEmailId: string
    now: Date
  },
  dependencies:
    AbandonedCheckoutRecoveryTransitionDependencies = {}
): Promise<boolean> {
  const parsed = parseInput(completeInputSchema, input)

  return await executeTransition(
    {
      name:
        'complete_abandoned_checkout_recovery_dispatch',
      args: {
        p_id: parsed.dispatchId,
        p_processing_owner: parsed.workerId,
        p_resend_email_id: parsed.resendEmailId,
        p_now: parsed.now.toISOString()
      }
    },
    dependencies,
    booleanResultSchema
  ) as boolean
}

export async function retryAbandonedCheckoutRecoveryDispatch(
  input: {
    dispatchId: string
    workerId: string
    errorCode: string
    retryAt: Date
    maxAttempts: number
    now: Date
  },
  dependencies:
    AbandonedCheckoutRecoveryTransitionDependencies = {}
): Promise<'pending' | 'failed' | null> {
  const parsed = parseInput(retryInputSchema, input)

  if (parsed.retryAt <= parsed.now) {
    throw new Error(
      'abandoned_checkout_recovery_transition_input_invalid'
    )
  }

  return await executeTransition(
    {
      name:
        'retry_abandoned_checkout_recovery_dispatch',
      args: {
        p_id: parsed.dispatchId,
        p_processing_owner: parsed.workerId,
        p_error_code: parsed.errorCode,
        p_retry_at: parsed.retryAt.toISOString(),
        p_max_attempts: parsed.maxAttempts,
        p_now: parsed.now.toISOString()
      }
    },
    dependencies,
    retryResultSchema
  ) as 'pending' | 'failed' | null
}
