import 'server-only'

import { z } from 'zod'

import {
  BEGIN_CHECKOUT_EVENT_ATTRIBUTE
} from '@/lib/analytics/checkoutAttributionSnapshot'

import type {
  CanonicalPurchase
} from '@/lib/analytics/purchaseEvent'

import type {
  OrderPaid
} from 'types/commerce/order/OrderPaid'

import {
  CHECKOUT_SESSION_TTL_SECONDS
} from './createCheckoutSession'

import {
  checkoutSessionSchema,
  type CheckoutAttempt,
  type CheckoutSession
} from './checkoutSessionSchema'

import {
  createCheckoutSessionEvent
} from './checkoutSessionEvent'

import {
  redisCheckoutSessionEventStream,
  type CheckoutSessionEventStream
} from './checkoutSessionEventStream'

import {
  redisCheckoutSessionStore,
  type CheckoutSessionStore
} from './checkoutSessionStore'

export const COMPLETE_CHECKOUT_SESSION_MAX_ATTEMPTS = 5

type PurchaseFinalityStore = Pick<
  CheckoutSessionStore,
  | 'getByBeginCheckoutEventId'
  | 'getByCartToken'
  | 'getByShopifyOrderId'
  | 'compareAndSet'
>

type PurchaseFinalityEventStream = Pick<
  CheckoutSessionEventStream,
  'append'
>

export type CompleteCheckoutSessionDependencies = {
  sessionStore?: PurchaseFinalityStore

  eventStream?: PurchaseFinalityEventStream
}

export type CompleteCheckoutSessionResult = {
  status:
    | 'updated'
    | 'duplicate'
    | 'missing'
    | 'session_conflict'
    | 'attempt_conflict'
    | 'conversion_conflict'
    | 'session_inactive'
    | 'conflict_exhausted'

  session_id?: string

  attempt_id?: string

  revision?: number

  journal_status:
    | 'appended'
    | 'failed'
    | 'not_required'
}

const orderAttributeSchema = z.strictObject({
  name: z.string().min(1).max(255),

  value: z.string().max(4096)
})

const purchaseFinalityInputSchema = z
  .strictObject({
    shopifyOrderId: z
      .string()
      .regex(/^gid:\/\/shopify\/Order\/\d+$/),

    shopifyOrderLegacyId: z.string().regex(/^\d+$/),

    shopifyOrderName: z.string().min(1).max(255),

    cartToken: z.string().min(1).max(512).nullable(),

    noteAttributes: z.array(orderAttributeSchema),

    canonicalPurchaseEventId: z.string().uuid(),

    occurredAt: z.string().datetime({ offset: true })
  })
  .superRefine((input, context) => {
    if (
      input.shopifyOrderId !==
      `gid://shopify/Order/${input.shopifyOrderLegacyId}`
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['shopifyOrderId'],
        message:
          'Shopify Order GID must match the legacy order ID'
      })
    }
  })

type PurchaseFinalityInput = z.infer<
  typeof purchaseFinalityInputSchema
>

function laterTimestamp(
  left: string,
  right: string
): string {
  return Date.parse(left) >= Date.parse(right) ? left : right
}

function earlierNullableTimestamp(
  left: string | null,
  right: string
): string {
  if (!left) {
    return right
  }

  return Date.parse(left) <= Date.parse(right) ? left : right
}

function extendSessionExpiry(
  currentExpiry: string,
  referenceAt: string
): string {
  const candidateExpiry = new Date(
    Date.parse(referenceAt) +
      CHECKOUT_SESSION_TTL_SECONDS * 1000
  ).toISOString()

  return laterTimestamp(currentExpiry, candidateExpiry)
}

function resolveBeginCheckoutEventId(
  attributes: readonly z.infer<
    typeof orderAttributeSchema
  >[]
): string | null {
  const values = new Set<string>()

  for (const attribute of attributes) {
    if (
      attribute.name !== BEGIN_CHECKOUT_EVENT_ATTRIBUTE
    ) {
      continue
    }

    const parsed = z.string().uuid().safeParse(attribute.value)

    if (!parsed.success) {
      return null
    }

    values.add(parsed.data)
  }

  return values.size === 1 ?
      values.values().next().value ?? null
    : null
}

function safeResult(
  status: CompleteCheckoutSessionResult['status'],
  session?: CheckoutSession,
  attemptId?: string,
  journalStatus: CompleteCheckoutSessionResult['journal_status'] =
    'not_required'
): CompleteCheckoutSessionResult {
  return {
    status,

    ...(session ?
      {
        session_id: session.session_id,

        revision: session.revision
      }
    : {}),

    ...(attemptId ? { attempt_id: attemptId } : {}),

    journal_status: journalStatus
  }
}

function resolveSession(
  sessions: readonly (CheckoutSession | null)[]
):
  | { status: 'missing' }
  | { status: 'conflict' }
  | { status: 'resolved'; session: CheckoutSession } {
  const available = sessions.filter(
    (session): session is CheckoutSession => session !== null
  )

  if (available.length === 0) {
    return { status: 'missing' }
  }

  const sessionIds = new Set(
    available.map(session => session.session_id)
  )

  if (sessionIds.size !== 1) {
    return { status: 'conflict' }
  }

  return {
    status: 'resolved',

    session: available[0]!
  }
}

function resolveAttempt(
  session: CheckoutSession,
  input: PurchaseFinalityInput,
  beginCheckoutEventId: string | null
):
  | { status: 'resolved'; attempt: CheckoutAttempt | null }
  | { status: 'conflict' } {
  const matches = session.checkout_attempts.filter(
    attempt =>
      attempt.klarna?.shopify_order_id ===
        input.shopifyOrderId ||
      (
        beginCheckoutEventId !== null &&
        attempt.begin_checkout_event_id ===
          beginCheckoutEventId
      )
  )

  const attemptIds = new Set(
    matches.map(attempt => attempt.attempt_id)
  )

  if (attemptIds.size > 1) {
    return { status: 'conflict' }
  }

  return {
    status: 'resolved',

    attempt: matches[0] ?? null
  }
}

function completeAttempt(
  attempt: CheckoutAttempt,
  input: PurchaseFinalityInput
): CheckoutAttempt {
  const completedAt = earlierNullableTimestamp(
    attempt.milestones.completed_at,
    input.occurredAt
  )

  const lastUpdatedAt = laterTimestamp(
    attempt.last_updated_at,
    input.occurredAt
  )

  if (attempt.method === 'shopify_checkout') {
    return {
      ...attempt,

      last_updated_at: lastUpdatedAt,

      milestones: {
        ...attempt.milestones,

        completed_at: completedAt
      },

      shopify: attempt.shopify ?
        {
          ...attempt.shopify,

          status: 'completed'
        }
      : null
    }
  }

  return {
    ...attempt,

    last_updated_at: lastUpdatedAt,

    milestones: {
      ...attempt.milestones,

      completed_at: completedAt
    },

    klarna: attempt.klarna ?
      {
        ...attempt.klarna,

        status: 'completed',

        shopify_order_id: input.shopifyOrderId
      }
    : null
  }
}

async function appendFinalityEvents(input: {
  eventStream: PurchaseFinalityEventStream

  session: CheckoutSession

  attempt: CheckoutAttempt | null

  purchase: PurchaseFinalityInput
}): Promise<'appended' | 'failed'> {
  const metadata = {
    canonical_purchase_event_id:
      input.purchase.canonicalPurchaseEventId,

    shopify_order_id:
      input.purchase.shopifyOrderId,

    ...(input.attempt ?
      {
        checkout_method: input.attempt.method
      }
    : {})
  }

  let failed = false

  for (const eventType of [
    'purchase.completed',
    'checkout_session.converted'
  ] as const) {
    try {
      await input.eventStream.append(
        createCheckoutSessionEvent({
          session: input.session,

          eventType,

          source: 'shopify_orders_webhook',

          attemptId: input.attempt?.attempt_id ?? null,

          metadata,

          now: () => new Date(input.purchase.occurredAt)
        })
      )
    } catch {
      failed = true
    }
  }

  return failed ? 'failed' : 'appended'
}

/**
 * Closes Checkout Session Registry state from the
 * already HMAC-verified Shopify orders/paid flow.
 *
 * Correlation precedence is defensive rather than
 * heuristic:
 *
 * - Shopify Order index for Klarna Express
 * - allowlisted begin_checkout UUID for hosted checkout
 * - Shopify cart token as a session-level fallback
 *
 * If available identities disagree, no Registry state
 * is mutated.
 */
export async function completeCheckoutSessionFromShopifyOrderPaid(
  order: OrderPaid,
  purchase: CanonicalPurchase,
  dependencies: CompleteCheckoutSessionDependencies = {}
): Promise<CompleteCheckoutSessionResult> {
  const parsedInput = purchaseFinalityInputSchema.parse({
    shopifyOrderId: order.admin_graphql_api_id,

    shopifyOrderLegacyId: String(order.id),

    shopifyOrderName: purchase.custom_data.order_name,

    cartToken: order.cart_token,

    noteAttributes: order.note_attributes,

    canonicalPurchaseEventId: purchase.event_id,

    occurredAt: purchase.event_time
  })

  const sessionStore =
    dependencies.sessionStore ?? redisCheckoutSessionStore

  const eventStream =
    dependencies.eventStream ?? redisCheckoutSessionEventStream

  const beginCheckoutEventId =
    resolveBeginCheckoutEventId(parsedInput.noteAttributes)

  const [orderSession, beginSession, cartSession] =
    await Promise.all([
      sessionStore.getByShopifyOrderId(
        parsedInput.shopifyOrderId
      ),

      beginCheckoutEventId ?
        sessionStore.getByBeginCheckoutEventId(
          beginCheckoutEventId
        )
      : Promise.resolve(null),

      parsedInput.cartToken ?
        sessionStore.getByCartToken(parsedInput.cartToken)
      : Promise.resolve(null)
    ])

  const resolvedSession = resolveSession([
    orderSession,
    beginSession,
    cartSession
  ])

  if (resolvedSession.status === 'missing') {
    return safeResult('missing')
  }

  if (resolvedSession.status === 'conflict') {
    return safeResult('session_conflict')
  }

  let current = resolvedSession.session

  for (
    let mutationAttempt = 0;
    mutationAttempt < COMPLETE_CHECKOUT_SESSION_MAX_ATTEMPTS;
    mutationAttempt += 1
  ) {
    if (current.state === 'converted') {
      if (
        current.conversion?.shopify_order_id ===
        parsedInput.shopifyOrderId
      ) {
        return safeResult(
          'duplicate',
          current,
          current.conversion.attempt_id ?? undefined
        )
      }

      return safeResult('conversion_conflict', current)
    }

    if (current.state !== 'active') {
      return safeResult('session_inactive', current)
    }

    const resolvedAttempt = resolveAttempt(
      current,
      parsedInput,
      beginCheckoutEventId
    )

    if (resolvedAttempt.status === 'conflict') {
      return safeResult('attempt_conflict', current)
    }

    const attempt = resolvedAttempt.attempt

    const nextAttempts = current.checkout_attempts.map(
      candidate =>
        candidate.attempt_id === attempt?.attempt_id ?
          completeAttempt(candidate, parsedInput)
        : candidate
    )

    const nextLastSeenAt = laterTimestamp(
      current.last_seen_at,
      parsedInput.occurredAt
    )

    const nextSession = checkoutSessionSchema.parse({
      ...current,

      revision: current.revision + 1,

      state: 'converted',

      checkout_attempts: nextAttempts,

      active_attempt_id: null,

      conversion: {
        occurred_at: parsedInput.occurredAt,

        attempt_id: attempt?.attempt_id ?? null,

        method: attempt?.method ?? null,

        shopify_order_id: parsedInput.shopifyOrderId,

        shopify_order_name: parsedInput.shopifyOrderName
      },

      recovery: {
        status: 'converted',

        preferred_target: null,

        public_recovery_id: null,

        last_evaluated_at: parsedInput.occurredAt,

        suppression_reason: 'purchase_completed'
      },

      last_seen_at: nextLastSeenAt,

      expires_at: extendSessionExpiry(
        current.expires_at,
        nextLastSeenAt
      )
    })

    const mutation = await sessionStore.compareAndSet({
      cartToken: current.shopify_cart.cart_token,

      expectedRevision: current.revision,

      nextSession
    })

    if (mutation.status === 'conflict') {
      current = mutation.current

      continue
    }

    if (mutation.status === 'missing') {
      return safeResult('missing')
    }

    const completedAttempt = attempt ?
      mutation.session.checkout_attempts.find(
        candidate => candidate.attempt_id === attempt.attempt_id
      ) ?? null
    : null

    const journalStatus = await appendFinalityEvents({
      eventStream,

      session: mutation.session,

      attempt: completedAttempt,

      purchase: parsedInput
    })

    return safeResult(
      'updated',
      mutation.session,
      completedAttempt?.attempt_id,
      journalStatus
    )
  }

  return safeResult('conflict_exhausted', current)
}
