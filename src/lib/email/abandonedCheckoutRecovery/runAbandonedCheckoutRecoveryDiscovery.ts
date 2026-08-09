import 'server-only'

import * as Sentry from '@sentry/nextjs'

import {
  shopifyAdminGraphql
} from '@/lib/shopify/shopifyAdminGraphql'

import {
  buildAbandonedCheckoutRecoveryPlan,
  type AbandonedCheckoutRecoveryDispatchPlan,
  type AbandonedCheckoutRecoverySuppressionReason,
  type ShopifyAbandonedCheckoutRecoveryCandidate
} from './abandonedCheckoutRecovery'

import {
  fetchShopifyAbandonedCheckoutRecoveryCandidates
} from './fetchShopifyAbandonedCheckoutRecoveryCandidates'

import {
  upsertAbandonedCheckoutRecoveryDispatches,
  type UpsertAbandonedCheckoutRecoveryDispatchesResult
} from './upsertAbandonedCheckoutRecoveryDispatches'

export type AbandonedCheckoutRecoveryDiscoveryFailureCode =
  | 'shopify_auth_failed'
  | 'shopify_rate_limited'
  | 'shopify_discovery_failed'
  | 'abandoned_checkout_recovery_persist_failed'
  | 'abandoned_checkout_recovery_discovery_failed'

export type RunAbandonedCheckoutRecoveryDiscoverySummary = {
  ok: true

  startedAt: string
  completedAt: string

  candidatesDiscovered: number
  dispatchPlansBuilt: number

  pendingPlans: number
  suppressedPlans: number

  persistence: {
    submitted: number
    affected: number
    unchanged: number
  }

  suppressionCounts:
    Partial<
      Record<
        AbandonedCheckoutRecoverySuppressionReason,
        number
      >
    >
}

export type RunAbandonedCheckoutRecoveryDiscoveryDependencies = {
  now?: () => Date

  fetchCandidates?: (
    input: {
      now: Date
    }
  ) => Promise<
    ShopifyAbandonedCheckoutRecoveryCandidate[]
  >

  buildPlans?: (
    candidates:
      readonly ShopifyAbandonedCheckoutRecoveryCandidate[],
    now: Date,
    activatedAt?: Date
  ) => AbandonedCheckoutRecoveryDispatchPlan[]

  persistPlans?: (
    plans:
      readonly AbandonedCheckoutRecoveryDispatchPlan[]
  ) => Promise<
    UpsertAbandonedCheckoutRecoveryDispatchesResult
  >
}

function assertValidDate(
  date: Date
) {
  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    throw new Error(
      'abandoned_checkout_recovery_invalid_now'
    )
  }
}

function getSuppressionCounts(
  plans:
    readonly AbandonedCheckoutRecoveryDispatchPlan[]
) {
  const counts:
    Partial<
      Record<
        AbandonedCheckoutRecoverySuppressionReason,
        number
      >
    > = {}

  for (const plan of plans) {
    const reason =
      plan.suppressionReason

    if (!reason) {
      continue
    }

    counts[reason] =
      (counts[reason] ?? 0) + 1
  }

  return counts
}

function classifyFailure(
  error: unknown
): AbandonedCheckoutRecoveryDiscoveryFailureCode {
  const message =
    error instanceof Error ?
      error.message
    : ''

  if (
    message.includes(
      'Shopify Admin API credentials'
    )
    || message.includes(
      'SHOPIFY_ADMIN_API_TOKEN'
    )
    || message.includes(
      'SHOPIFY_STORE_DOMAIN'
    )
  ) {
    return 'shopify_auth_failed'
  }

  if (
    message.includes(
      'Shopify Admin API error (429)'
    )
  ) {
    return 'shopify_rate_limited'
  }

  if (
    message.startsWith(
      'Shopify Admin API'
    )
    || message.startsWith(
      'Shopify GraphQL'
    )
    || message.startsWith(
      'Shopify Admin GraphQL'
    )
  ) {
    return 'shopify_discovery_failed'
  }

  if (
    message.startsWith(
      'abandoned_checkout_recovery_persist'
    )
    || message.startsWith(
      'supabase_admin_'
    )
  ) {
    return 'abandoned_checkout_recovery_persist_failed'
  }

  return 'abandoned_checkout_recovery_discovery_failed'
}

async function defaultFetchCandidates(
  input: {
    now: Date
  }
) {
  return fetchShopifyAbandonedCheckoutRecoveryCandidates({
    now:
      input.now,

    executeAdminGraphql:
      async ({
        query,
        variables
      }) =>
        shopifyAdminGraphql<unknown>(
          query,
          variables
        )
  })
}

export async function runAbandonedCheckoutRecoveryDiscovery(
  dependencies:
    RunAbandonedCheckoutRecoveryDiscoveryDependencies = {},
  activatedAt: Date = new Date(0)
): Promise<
  RunAbandonedCheckoutRecoveryDiscoverySummary
> {
  const now =
    dependencies.now
    ?? (() => new Date())

  const fetchCandidates =
    dependencies.fetchCandidates
    ?? defaultFetchCandidates

  const buildPlans =
    dependencies.buildPlans
    ?? buildAbandonedCheckoutRecoveryPlan

  const persistPlans =
    dependencies.persistPlans
    ?? upsertAbandonedCheckoutRecoveryDispatches

  const startedAtDate =
    now()

  assertValidDate(
    startedAtDate
  )

  const startedAt =
    startedAtDate.toISOString()

  try {
    return await Sentry.startSpan(
      {
        name:
          'abandoned_checkout_recovery.discovery',
        op:
          'workflow'
      },
      async () => {
        const candidates =
          await fetchCandidates({
            now:
              startedAtDate
          })

        const plans =
          buildPlans(
            candidates,
            startedAtDate,
            activatedAt
          )

        const pendingPlans =
          plans.filter(
            plan =>
              plan.status
              === 'pending'
          ).length

        const suppressedPlans =
          plans.length
          - pendingPlans

        const suppressionCounts =
          getSuppressionCounts(
            plans
          )

        const persistence =
          await persistPlans(
            plans
          )

        const completedAtDate =
          now()

        assertValidDate(
          completedAtDate
        )

        return {
          ok:
            true,

          startedAt,

          completedAt:
            completedAtDate
              .toISOString(),

          candidatesDiscovered:
            candidates.length,

          dispatchPlansBuilt:
            plans.length,

          pendingPlans,

          suppressedPlans,

          persistence: {
            submitted:
              persistence.submitted,
            affected:
              persistence.affected,
            unchanged:
              persistence.unchanged
          },

          suppressionCounts
        }
      }
    )
  } catch (error) {
    /*
     * Inspect the original error locally only to map it
     * to a bounded machine-readable code.
     *
     * Do not send the original Shopify/Supabase error
     * object or message into Sentry.
     */
    const failureCode =
      classifyFailure(error)

    Sentry.withScope(scope => {
      scope.setTag(
        'workflow',
        'abandoned_checkout_recovery_discovery'
      )

      scope.setTag(
        'failure_code',
        failureCode
      )

      Sentry.captureException(
        new Error(
          failureCode
        )
      )
    })

    /*
     * Also prevent raw upstream errors from crossing the
     * discovery boundary into a Vercel response/log.
     */
    throw new Error(
      failureCode
    )
  }
}
