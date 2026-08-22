/*
 * Sequence version 2 is already reserved in the database contract for the
 * historical +1/+7/+24-hour schedule. The +4/+24/+72-hour schedule is v3.
 */
export const ABANDONED_CHECKOUT_RECOVERY_SEQUENCE_VERSION = 3 as const

export const ABANDONED_CHECKOUT_RECOVERY_WINDOW_MS =
  7 * 24 * 60 * 60 * 1000

const HOUR_MS =
  60 * 60 * 1000

export const ABANDONED_CHECKOUT_RECOVERY_SEQUENCE = [
  {
    step: 1,
    delayMs: 4 * HOUR_MS
  },
  {
    step: 2,
    delayMs: 24 * HOUR_MS
  },
  {
    step: 3,
    delayMs: 72 * HOUR_MS
  }
] as const

export type AbandonedCheckoutRecoveryStep =
  typeof ABANDONED_CHECKOUT_RECOVERY_SEQUENCE[number]['step']

export type CustomerEmailMarketingState =
  | 'INVALID'
  | 'NOT_SUBSCRIBED'
  | 'PENDING'
  | 'SUBSCRIBED'
  | 'UNSUBSCRIBED'

export type ShopifyAbandonedCheckoutRecoveryCandidate = {
  checkoutId: string
  customerId: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  numberOfOrders: number | null
  email: {
    address: string
    marketingState: CustomerEmailMarketingState
    validFormat: boolean
  } | null
}

export type AbandonedCheckoutRecoverySuppressionReason =
  | 'recovered'
  | 'customer_has_orders'
  | 'unknown_order_count'
  | 'missing_customer'
  | 'missing_email'
  | 'invalid_email'
  | 'not_subscribed'
  | 'outside_window'
  | 'future_checkout_timestamp'
  | 'superseded_by_newer_checkout'

export type AbandonedCheckoutRecoveryDispatchPlan = {
  shopifyAbandonedCheckoutId: string
  shopifyCustomerId: string | null
  sequenceVersion: typeof ABANDONED_CHECKOUT_RECOVERY_SEQUENCE_VERSION
  step: AbandonedCheckoutRecoveryStep
  checkoutCreatedAt: string
  checkoutUpdatedAt: string
  dueAt: string
  nextAttemptAt: string
  status: 'pending' | 'suppressed'
  suppressionReason: AbandonedCheckoutRecoverySuppressionReason | null
  suppressedAt: string | null
}

export type AbandonedCheckoutRecoveryDispatchInsert = {
  shopify_abandoned_checkout_id: string
  shopify_customer_id: string | null
  sequence_version: typeof ABANDONED_CHECKOUT_RECOVERY_SEQUENCE_VERSION
  step: AbandonedCheckoutRecoveryStep
  checkout_created_at: string
  checkout_updated_at: string
  due_at: string
  next_attempt_at: string
  status: 'pending' | 'suppressed'
  suppression_reason: AbandonedCheckoutRecoverySuppressionReason | null
  suppressed_at: string | null
}

function parseIsoTimestamp(
  value: string,
  fieldName: string
): number {
  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid ${fieldName}: ${value}`)
  }

  return timestamp
}

function compareCheckoutRecency(
  left: ShopifyAbandonedCheckoutRecoveryCandidate,
  right: ShopifyAbandonedCheckoutRecoveryCandidate
): number {
  const createdDifference =
    parseIsoTimestamp(left.createdAt, 'createdAt') -
    parseIsoTimestamp(right.createdAt, 'createdAt')

  if (createdDifference !== 0) {
    return createdDifference
  }

  const updatedDifference =
    parseIsoTimestamp(left.updatedAt, 'updatedAt') -
    parseIsoTimestamp(right.updatedAt, 'updatedAt')

  if (updatedDifference !== 0) {
    return updatedDifference
  }

  return left.checkoutId.localeCompare(right.checkoutId)
}

function getLatestCheckoutIdByCustomer(
  checkouts: readonly ShopifyAbandonedCheckoutRecoveryCandidate[]
): ReadonlyMap<string, string> {
  const latestByCustomer = new Map<
    string,
    ShopifyAbandonedCheckoutRecoveryCandidate
  >()

  for (const checkout of checkouts) {
    if (!checkout.customerId) {
      continue
    }

    const current = latestByCustomer.get(checkout.customerId)

    if (
      !current ||
      compareCheckoutRecency(checkout, current) > 0
    ) {
      latestByCustomer.set(
        checkout.customerId,
        checkout
      )
    }
  }

  return new Map(
    [...latestByCustomer.entries()].map(
      ([customerId, checkout]) => [
        customerId,
        checkout.checkoutId
      ]
    )
  )
}

function getSuppressionReason(
  checkout: ShopifyAbandonedCheckoutRecoveryCandidate,
  nowMs: number,
  latestCheckoutIdByCustomer: ReadonlyMap<string, string>
): AbandonedCheckoutRecoverySuppressionReason | null {
  if (checkout.completedAt !== null) {
    return 'recovered'
  }

  const createdAtMs = parseIsoTimestamp(
    checkout.createdAt,
    'createdAt'
  )

  if (createdAtMs > nowMs) {
    return 'future_checkout_timestamp'
  }

  if (
    nowMs - createdAtMs >
    ABANDONED_CHECKOUT_RECOVERY_WINDOW_MS
  ) {
    return 'outside_window'
  }

  if (!checkout.customerId) {
    return 'missing_customer'
  }

  if (checkout.numberOfOrders === null) {
    return 'unknown_order_count'
  }

  if (checkout.numberOfOrders > 0) {
    return 'customer_has_orders'
  }

  const latestCheckoutId =
    latestCheckoutIdByCustomer.get(checkout.customerId)

  if (
    latestCheckoutId &&
    latestCheckoutId !== checkout.checkoutId
  ) {
    return 'superseded_by_newer_checkout'
  }

  if (!checkout.email) {
    return 'missing_email'
  }

  if (!checkout.email.validFormat) {
    return 'invalid_email'
  }

  if (checkout.email.marketingState !== 'SUBSCRIBED') {
    return 'not_subscribed'
  }

  return null
}

export function buildAbandonedCheckoutRecoveryPlan(
  checkouts: readonly ShopifyAbandonedCheckoutRecoveryCandidate[],
  now: Date,
  activationAt: Date
): AbandonedCheckoutRecoveryDispatchPlan[] {
  const nowMs = now.getTime()
  const activationAtMs = activationAt.getTime()

  if (!Number.isFinite(nowMs)) {
    throw new Error('Invalid now date')
  }

  if (!Number.isFinite(activationAtMs)) {
    throw new Error('Invalid activationAt date')
  }

  const activatedCheckouts =
    checkouts.filter(checkout =>
      parseIsoTimestamp(
        checkout.createdAt,
        'createdAt'
      ) >= activationAtMs
    )

  const latestCheckoutIdByCustomer =
    getLatestCheckoutIdByCustomer(activatedCheckouts)

  const suppressedAt = now.toISOString()

  return activatedCheckouts.flatMap(checkout => {
    const createdAtMs = parseIsoTimestamp(
      checkout.createdAt,
      'createdAt'
    )

    const updatedAtMs = parseIsoTimestamp(
      checkout.updatedAt,
      'updatedAt'
    )

    const suppressionReason = getSuppressionReason(
      checkout,
      nowMs,
      latestCheckoutIdByCustomer
    )

    return ABANDONED_CHECKOUT_RECOVERY_SEQUENCE.map(
      sequenceStep => {
        const dueAt = new Date(
          createdAtMs + sequenceStep.delayMs
        ).toISOString()

        return {
          shopifyAbandonedCheckoutId:
            checkout.checkoutId,
          shopifyCustomerId:
            checkout.customerId,
          sequenceVersion:
            ABANDONED_CHECKOUT_RECOVERY_SEQUENCE_VERSION,
          step:
            sequenceStep.step,
          checkoutCreatedAt:
            new Date(createdAtMs).toISOString(),
          checkoutUpdatedAt:
            new Date(updatedAtMs).toISOString(),
          dueAt,
          nextAttemptAt: dueAt,
          status:
            suppressionReason ?
              'suppressed' as const
            : 'pending' as const,
          suppressionReason,
          suppressedAt:
            suppressionReason ?
              suppressedAt
            : null
        }
      }
    )
  })
}

export function toAbandonedCheckoutRecoveryDispatchInsert(
  plan: AbandonedCheckoutRecoveryDispatchPlan
): AbandonedCheckoutRecoveryDispatchInsert {
  return {
    shopify_abandoned_checkout_id:
      plan.shopifyAbandonedCheckoutId,
    shopify_customer_id:
      plan.shopifyCustomerId,
    sequence_version:
      plan.sequenceVersion,
    step:
      plan.step,
    checkout_created_at:
      plan.checkoutCreatedAt,
    checkout_updated_at:
      plan.checkoutUpdatedAt,
    due_at:
      plan.dueAt,
    next_attempt_at:
      plan.nextAttemptAt,
    status:
      plan.status,
    suppression_reason:
      plan.suppressionReason,
    suppressed_at:
      plan.suppressedAt
  }
}

export function getAbandonedCheckoutRecoveryResendIdempotencyKey(
  input: {
    shopifyAbandonedCheckoutId: string
    sequenceVersion: number
    step: number
  }
): string {
  return [
    'abandoned-checkout',
    input.shopifyAbandonedCheckoutId,
    `v${input.sequenceVersion}`,
    `step-${input.step}`
  ].join(':')
}
