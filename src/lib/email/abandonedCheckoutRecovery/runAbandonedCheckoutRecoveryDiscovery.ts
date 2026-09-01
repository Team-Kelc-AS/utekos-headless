import 'server-only'

import { z } from 'zod'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'

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
  resolveCheckoutRecoveryEmailMarketingAcceptance
} from './resolveCheckoutRecoveryEmailMarketingAcceptance'

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
  activationAt: Date

  canaryEmail?: string | null

  now?: () => Date

  fetchCandidates?: (
    input: {
      activationAt: Date
      now: Date
    }
  ) => Promise<
    ShopifyAbandonedCheckoutRecoveryCandidate[]
  >

  resolveCheckoutEmailMarketingAcceptance?: (
    candidate: ShopifyAbandonedCheckoutRecoveryCandidate
  ) => Promise<boolean>

  buildPlans?: (
    candidates:
      readonly ShopifyAbandonedCheckoutRecoveryCandidate[],
    now: Date,
    activationAt: Date
  ) => AbandonedCheckoutRecoveryDispatchPlan[]

  persistPlans?: (
    plans:
      readonly AbandonedCheckoutRecoveryDispatchPlan[]
  ) => Promise<
    UpsertAbandonedCheckoutRecoveryDispatchesResult
  >
}

function parseCanaryEmail(
  value: string | null | undefined
): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const parsed = z
    .email()
    .max(320)
    .safeParse(
      value.trim().toLowerCase()
    )

  if (!parsed.success) {
    throw new Error(
      'abandoned_checkout_recovery_canary_email_invalid'
    )
  }

  return parsed.data
}

function assertValidDate(
  date: Date,
  fieldName: 'activation_at' | 'now'
) {
  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    throw new Error(
      `abandoned_checkout_recovery_invalid_${fieldName}`
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
      'STORE_DOMAIN'
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
    activationAt: Date
    now: Date
  }
) {
  return fetchShopifyAbandonedCheckoutRecoveryCandidates({
    activationAt:
      input.activationAt,

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
    RunAbandonedCheckoutRecoveryDiscoveryDependencies
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
  const resolveCheckoutEmailMarketingAcceptance =
    dependencies.resolveCheckoutEmailMarketingAcceptance
    ?? (candidate => {
      if (!candidate.beginCheckoutEventId || !candidate.email) {
        return Promise.resolve(false)
      }

      return resolveCheckoutRecoveryEmailMarketingAcceptance({
        beginCheckoutEventId: candidate.beginCheckoutEventId,
        email: candidate.email.address,
        checkoutCreatedAt: candidate.createdAt,
        now: startedAtDate
      })
    })

  const startedAtDate =
    now()

  assertValidDate(
    startedAtDate,
    'now'
  )

  assertValidDate(
    dependencies.activationAt,
    'activation_at'
  )

  const startedAt =
    startedAtDate.toISOString()

  try {
    const canaryEmail =
      parseCanaryEmail(
        dependencies.canaryEmail === undefined ?
          process.env
            .ABANDONED_CHECKOUT_RECOVERY_CANARY_EMAIL
        : dependencies.canaryEmail
      )

    return await startAnalyticsSpan(
      {
        name:
          'abandoned_checkout_recovery.discovery',
        op:
          'workflow'
      },
      async () => {
        const discoveredCandidates =
          await fetchCandidates({
            activationAt:
              dependencies.activationAt,

            now:
              startedAtDate
          })

        const filteredCandidates =
          canaryEmail ?
            discoveredCandidates.filter(
              candidate =>
                candidate.email?.address
                  .trim()
                  .toLowerCase()
                === canaryEmail
            )
          : discoveredCandidates

        const candidates = await Promise.all(
          filteredCandidates.map(async candidate => {
            if (
              candidate.email?.marketingState !== 'NOT_SUBSCRIBED'
              || !candidate.beginCheckoutEventId
            ) {
              return candidate
            }

            return {
              ...candidate,
              checkoutEmailMarketingAccepted:
                await resolveCheckoutEmailMarketingAcceptance(
                  candidate
                )
            }
          })
        )

        const plans =
          buildPlans(
            candidates,
            startedAtDate,
            dependencies.activationAt
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
          completedAtDate,
          'now'
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
     * object or message into operational logs.
     */
    const failureCode =
      classifyFailure(error)

    reportOperationalError({
      error: new Error(failureCode),
      event: 'abandoned_checkout_recovery.discovery_failed',
      context: {
        failureCode,
        workflow: 'abandoned_checkout_recovery_discovery'
      }
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
