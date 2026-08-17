import 'server-only'

import { z } from 'zod'

import {
  shopifyCanonicalPaymentObservationSchema,
  type ShopifyCheckoutObservation
} from '@/lib/analytics/shopifyCheckoutObservationContract'
import { getPostgresClient } from '@/lib/db/getPostgresClient'

import { CHECKOUT_SESSION_TTL_SECONDS } from './createCheckoutSession'

import {
  checkoutSessionSchema,
  type CheckoutAttempt,
  type CheckoutSession
} from './checkoutSessionSchema'

import {
  createCheckoutSessionEvent,
  type CheckoutSessionEventMetadata,
  type CheckoutSessionEventType
} from './checkoutSessionEvent'

import {
  redisCheckoutSessionEventStream,
  type CheckoutSessionEventStream
} from './checkoutSessionEventStream'

import {
  redisCheckoutSessionStore,
  type CheckoutSessionStore
} from './checkoutSessionStore'

export const SHOPIFY_CHECKOUT_RECONCILIATION_MAX_ATTEMPTS = 5

type ShopifyAttemptState = NonNullable<
  CheckoutAttempt['shopify']
>

type ShopifyCheckoutAttempt = CheckoutAttempt & {
  method: 'shopify_checkout'
  shopify: ShopifyAttemptState
  klarna: null
}

type CheckoutSessionReconciliationStore = Pick<
  CheckoutSessionStore,
  'getByBeginCheckoutEventId' | 'compareAndSet'
>

type CheckoutSessionReconciliationEventStream = Pick<
  CheckoutSessionEventStream,
  'append'
>

type ObservedCheckoutProgress = {
  shippingInfoSubmittedAt: string | null

  paymentInfoSubmittedAt: string | null
}

export type ShopifyCheckoutReconciliationDependencies = {
  sessionStore?: CheckoutSessionReconciliationStore

  eventStream?: CheckoutSessionReconciliationEventStream

  lookupObservedProgress?: (
    checkoutToken: string
  ) => Promise<ObservedCheckoutProgress>
}

export type ShopifyCheckoutReconciliationStatus =
  | 'skipped'
  | 'missing'
  | 'attempt_missing'
  | 'session_inactive'
  | 'checkout_token_unavailable'
  | 'checkout_token_mismatch'
  | 'abandonment_conflict'
  | 'no_change'
  | 'updated'
  | 'conflict_exhausted'

export type ShopifyCheckoutReconciliationResult = {
  status: ShopifyCheckoutReconciliationStatus

  session_id?: string

  attempt_id?: string

  revision?: number

  journal_status: 'appended' | 'failed' | 'not_required'
}

export type ShopifyNativeAbandonmentRegistryInput = {
  beginCheckoutEventId: string

  abandonedCheckoutId: string

  recoveryUrl: string

  createdAt: string

  updatedAt: string

  completedAt: string | null

  mostRecentStep: string | null

  inventoryAvailable: boolean

  nativeEmailState: 'NOT_SENT' | 'SCHEDULED' | 'SENT' | null

  customerHasNoOrderSinceAbandonment: boolean

  customerHasNoDraftOrderSinceAbandonment: boolean
}

const nativeAbandonmentInputSchema = z
  .strictObject({
    beginCheckoutEventId: z.string().uuid(),

    abandonedCheckoutId: z
      .string()
      .regex(/^gid:\/\/shopify\/AbandonedCheckout\/\d+$/),

    recoveryUrl: z.string().url().max(4000),

    createdAt: z.string().datetime({ offset: true }),

    updatedAt: z.string().datetime({ offset: true }),

    completedAt: z
      .string()
      .datetime({ offset: true })
      .nullable(),

    mostRecentStep: z.string().min(1).max(255).nullable(),

    inventoryAvailable: z.boolean(),

    nativeEmailState: z
      .enum(['NOT_SENT', 'SCHEDULED', 'SENT'])
      .nullable(),

    customerHasNoOrderSinceAbandonment: z.boolean(),

    customerHasNoDraftOrderSinceAbandonment: z.boolean()
  })
  .superRefine((input, context) => {
    let recoveryUrl: URL

    try {
      recoveryUrl = new URL(input.recoveryUrl)
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recoveryUrl'],
        message: 'Shopify recovery URL is invalid'
      })

      return
    }

    if (
      recoveryUrl.protocol !== 'https:' ||
      recoveryUrl.username !== '' ||
      recoveryUrl.password !== '' ||
      recoveryUrl.hostname === ''
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recoveryUrl'],
        message:
          'Shopify recovery URL must be an HTTPS capability URL without embedded credentials'
      })
    }

    if (
      Date.parse(input.updatedAt) < Date.parse(input.createdAt)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['updatedAt'],
        message:
          'Shopify abandoned checkout updatedAt cannot precede createdAt'
      })
    }
  })

type JournalSpecification = {
  eventType: CheckoutSessionEventType

  occurredAt: string

  metadata?: CheckoutSessionEventMetadata
}

function findShopifyAttempt(
  session: CheckoutSession,
  beginCheckoutEventId: string
): ShopifyCheckoutAttempt | null {
  const attempt = session.checkout_attempts.find(
    candidate =>
      candidate.begin_checkout_event_id ===
        beginCheckoutEventId &&
      candidate.method === 'shopify_checkout' &&
      candidate.shopify !== null
  )

  if (
    !attempt ||
    attempt.method !== 'shopify_checkout' ||
    !attempt.shopify
  ) {
    return null
  }

  return attempt as ShopifyCheckoutAttempt
}

function normalizeIsoTimestamp(
  value: string | Date
): string | null {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function earlierNullableTimestamp(
  left: string | null,
  right: string | null
): string | null {
  if (!left) {
    return right
  }

  if (!right) {
    return left
  }

  return Date.parse(left) <= Date.parse(right) ? left : right
}

function laterTimestamp(left: string, right: string): string {
  return Date.parse(left) >= Date.parse(right) ? left : right
}

function laterNullableTimestamp(
  left: string | null,
  right: string | null
): string | null {
  if (!left) {
    return right
  }

  if (!right) {
    return left
  }

  return laterTimestamp(left, right)
}

function extendSessionExpiry(
  currentExpiry: string,
  referenceAt: string
): string {
  const candidateExpiry = new Date(
    Date.parse(referenceAt) + CHECKOUT_SESSION_TTL_SECONDS * 1000
  ).toISOString()

  return laterTimestamp(currentExpiry, candidateExpiry)
}

function progressProviderStatus(
  current: ShopifyAttemptState['status']
): ShopifyAttemptState['status'] {
  switch (current) {
    case 'unresolved':
    case 'checkout_url_resolved':
    case 'checkout_active':
      return 'checkout_active'

    default:
      /*
       * Never downgrade:
       *
       * native_abandonment_available
       * recovered
       * completed
       * failed
       */
      return current
  }
}

function nativeProviderStatus(
  current: ShopifyAttemptState['status'],
  completedAt: string | null
): ShopifyAttemptState['status'] {
  if (current === 'completed' || current === 'failed') {
    return current
  }

  if (completedAt !== null) {
    return 'recovered'
  }

  if (current === 'recovered') {
    return current
  }

  return 'native_abandonment_available'
}

async function defaultLookupObservedProgress(
  checkoutToken: string
): Promise<ObservedCheckoutProgress> {
  const sql = getPostgresClient()

  if (!sql) {
    throw new Error(
      'shopify_checkout_observation_store_unavailable'
    )
  }

  const rows = await sql`
      select
        event_name,
        min(occurred_at) as occurred_at
      from
        ops.shopify_checkout_observations
      where
        checkout_token =
          ${checkoutToken}
        and verification_status =
          'observed'
        and event_name in (
          'checkout_shipping_info_submitted',
          'payment_info_submitted'
        )
      group by
        event_name
    `

  let shippingInfoSubmittedAt: string | null = null

  let paymentInfoSubmittedAt: string | null = null

  for (const row of rows) {
    const eventName = row.event_name

    const occurredAt = row.occurred_at

    if (
      typeof eventName !== 'string' ||
      (typeof occurredAt !== 'string' &&
        !(occurredAt instanceof Date))
    ) {
      continue
    }

    const normalized = normalizeIsoTimestamp(occurredAt)

    if (!normalized) {
      continue
    }

    if (eventName === 'checkout_shipping_info_submitted') {
      shippingInfoSubmittedAt = earlierNullableTimestamp(
        shippingInfoSubmittedAt,
        normalized
      )
    }

    if (eventName === 'payment_info_submitted') {
      paymentInfoSubmittedAt = earlierNullableTimestamp(
        paymentInfoSubmittedAt,
        normalized
      )
    }
  }

  return { shippingInfoSubmittedAt, paymentInfoSubmittedAt }
}

async function appendJournalEvents(input: {
  eventStream: CheckoutSessionReconciliationEventStream

  session: CheckoutSession

  attemptId: string

  specifications: readonly JournalSpecification[]
}): Promise<'appended' | 'failed' | 'not_required'> {
  if (input.specifications.length === 0) {
    return 'not_required'
  }

  let failed = false

  for (const specification of input.specifications) {
    try {
      const event = createCheckoutSessionEvent({
        session: input.session,

        eventType: specification.eventType,

        source:
          (
            specification.eventType ===
              'shopify_checkout.abandonment_attached' ||
            specification.eventType ===
              'shopify_checkout.recovered'
          ) ?
            'shopify_admin_graphql'
          : 'shopify_web_pixel',

        attemptId: input.attemptId,

        metadata: specification.metadata ?? {},

        now: () => new Date(specification.occurredAt)
      })

      await input.eventStream.append(event)
    } catch {
      /*
       * Registry state has already committed.
       *
       * The Redis Stream is an operational journal,
       * therefore a journal outage must not roll back
       * a valid Registry mutation or block checkout.
       *
       * Intentionally no token/URL/error-object logging
       * here.
       */
      failed = true
    }
  }

  return failed ? 'failed' : 'appended'
}

function safeResult(
  status: ShopifyCheckoutReconciliationStatus,
  session?: CheckoutSession,
  attemptId?: string,
  journalStatus: ShopifyCheckoutReconciliationResult['journal_status'] = 'not_required'
): ShopifyCheckoutReconciliationResult {
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

/**
 * Reconciles browser-observed Shopify checkout progress
 * into an already server-established Shopify attempt.
 *
 * Security boundary:
 *
 * - v1 observations never locate a Registry record.
 * - only v2 payment_info_submitted has the canonical
 *   begin_checkout UUID correlation.
 * - the browser-provided checkoutToken is never trusted
 *   as an index.
 * - it must exactly equal the checkout token previously
 *   captured server-side before any mutation occurs.
 */
export async function reconcileShopifyCheckoutObservation(
  observation: ShopifyCheckoutObservation,
  dependencies: ShopifyCheckoutReconciliationDependencies = {}
): Promise<ShopifyCheckoutReconciliationResult> {
  const canonicalObservation =
    shopifyCanonicalPaymentObservationSchema.safeParse(
      observation
    )

  if (!canonicalObservation.success) {
    return safeResult('skipped')
  }

  const sessionStore =
    dependencies.sessionStore ?? redisCheckoutSessionStore

  const eventStream =
    dependencies.eventStream ?? redisCheckoutSessionEventStream

  const lookupObservedProgress =
    dependencies.lookupObservedProgress ??
    defaultLookupObservedProgress

  const parsedObservation = canonicalObservation.data

  const beginCheckoutEventId =
    parsedObservation.correlation.beginCheckoutEventId

  const directPaymentAt = normalizeIsoTimestamp(
    parsedObservation.occurredAt
  )

  if (!directPaymentAt) {
    return safeResult('skipped')
  }

  let current = await sessionStore.getByBeginCheckoutEventId(
    beginCheckoutEventId
  )

  let progressLookupToken: string | null = null

  let observedProgress: ObservedCheckoutProgress = {
    shippingInfoSubmittedAt: null,

    paymentInfoSubmittedAt: directPaymentAt
  }

  for (
    let mutationAttempt = 0;
    mutationAttempt <
    SHOPIFY_CHECKOUT_RECONCILIATION_MAX_ATTEMPTS;
    mutationAttempt += 1
  ) {
    if (!current) {
      return safeResult('missing')
    }

    if (current.state !== 'active') {
      return safeResult('session_inactive', current)
    }

    const checkoutAttempt = findShopifyAttempt(
      current,
      beginCheckoutEventId
    )

    if (!checkoutAttempt) {
      return safeResult('attempt_missing', current)
    }

    const trustedCheckoutToken =
      checkoutAttempt.shopify.checkout_token

    if (!trustedCheckoutToken) {
      return safeResult(
        'checkout_token_unavailable',
        current,
        checkoutAttempt.attempt_id
      )
    }

    if (
      trustedCheckoutToken !== parsedObservation.checkoutToken
    ) {
      return safeResult(
        'checkout_token_mismatch',
        current,
        checkoutAttempt.attempt_id
      )
    }

    if (progressLookupToken !== trustedCheckoutToken) {
      progressLookupToken = trustedCheckoutToken

      /*
       * Durable observation lookup is enrichment only.
       *
       * If Postgres is temporarily unavailable we still
       * have the current, schema-v2 payment observation
       * that safely matched the server-established
       * checkout token.
       */
      try {
        const persistedProgress = await lookupObservedProgress(
          trustedCheckoutToken
        )

        observedProgress = {
          shippingInfoSubmittedAt:
            persistedProgress.shippingInfoSubmittedAt ?
              normalizeIsoTimestamp(
                persistedProgress.shippingInfoSubmittedAt
              )
            : null,

          paymentInfoSubmittedAt: earlierNullableTimestamp(
            persistedProgress.paymentInfoSubmittedAt ?
              normalizeIsoTimestamp(
                persistedProgress.paymentInfoSubmittedAt
              )
            : null,
            directPaymentAt
          )
        }
      } catch {
        observedProgress = {
          shippingInfoSubmittedAt: null,

          paymentInfoSubmittedAt: directPaymentAt
        }
      }
    }

    const nextShippingAt = earlierNullableTimestamp(
      checkoutAttempt.milestones.shipping_info_submitted_at,
      observedProgress.shippingInfoSubmittedAt
    )

    const nextPaymentAt = earlierNullableTimestamp(
      checkoutAttempt.milestones.payment_info_submitted_at,
      observedProgress.paymentInfoSubmittedAt
    )

    const nextStatus = progressProviderStatus(
      checkoutAttempt.shopify.status
    )

    const referenceAt =
      laterNullableTimestamp(
        observedProgress.shippingInfoSubmittedAt,
        observedProgress.paymentInfoSubmittedAt
      ) ?? directPaymentAt

    const nextAttemptUpdatedAt = laterTimestamp(
      checkoutAttempt.last_updated_at,
      referenceAt
    )

    const nextSessionLastSeenAt = laterTimestamp(
      current.last_seen_at,
      referenceAt
    )

    const nextExpiresAt = extendSessionExpiry(
      current.expires_at,
      nextSessionLastSeenAt
    )

    const shippingChanged =
      nextShippingAt !==
      checkoutAttempt.milestones.shipping_info_submitted_at

    const paymentChanged =
      nextPaymentAt !==
      checkoutAttempt.milestones.payment_info_submitted_at

    const providerStatusChanged =
      nextStatus !== checkoutAttempt.shopify.status

    const changed =
      shippingChanged ||
      paymentChanged ||
      providerStatusChanged ||
      nextAttemptUpdatedAt !== checkoutAttempt.last_updated_at ||
      nextSessionLastSeenAt !== current.last_seen_at ||
      nextExpiresAt !== current.expires_at

    if (!changed) {
      return safeResult(
        'no_change',
        current,
        checkoutAttempt.attempt_id
      )
    }

    const nextAttempts = current.checkout_attempts.map(
      candidate => {
        if (
          candidate.attempt_id !== checkoutAttempt.attempt_id
        ) {
          return candidate
        }

        return {
          ...checkoutAttempt,

          last_updated_at: nextAttemptUpdatedAt,

          milestones: {
            ...checkoutAttempt.milestones,

            shipping_info_submitted_at: nextShippingAt,

            payment_info_submitted_at: nextPaymentAt
          },

          shopify: {
            ...checkoutAttempt.shopify,

            status: nextStatus
          }
        }
      }
    )

    const nextSession = checkoutSessionSchema.parse({
      ...current,

      revision: current.revision + 1,

      checkout_attempts: nextAttempts,

      last_seen_at: nextSessionLastSeenAt,

      expires_at: nextExpiresAt
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

    const journalSpecifications: JournalSpecification[] = []

    if (shippingChanged && nextShippingAt) {
      journalSpecifications.push({
        eventType: 'shopify_checkout.shipping_info_submitted',

        occurredAt: nextShippingAt,

        metadata: {
          verification_status: 'observed',

          reconciled_from: 'durable_checkout_observation'
        }
      })
    }

    if (paymentChanged || providerStatusChanged) {
      journalSpecifications.push({
        eventType: 'shopify_checkout.payment_info_submitted',

        occurredAt: directPaymentAt,

        metadata: {
          verification_status: 'observed',

          schema_version: parsedObservation.schemaVersion,

          correlation: 'begin_checkout_event_id'
        }
      })
    }

    const journalStatus = await appendJournalEvents({
      eventStream,

      session: mutation.session,

      attemptId: checkoutAttempt.attempt_id,

      specifications: journalSpecifications
    })

    return safeResult(
      'updated',
      mutation.session,
      checkoutAttempt.attempt_id,
      journalStatus
    )
  }

  return safeResult('conflict_exhausted', current ?? undefined)
}

/**
 * Attaches Shopify Admin's authoritative native
 * AbandonedCheckout/Abandonment state to a Registry
 * attempt using the allowlisted begin_checkout UUID.
 *
 * The private recovery URL deliberately stays inside
 * the Checkout Session Registry.
 *
 * `completedAt` transitions the provider state to
 * `recovered`; it does NOT close the Checkout Session
 * as a purchase. Authoritative Order/Purchase closure
 * remains a separate finality step.
 */
export async function reconcileShopifyNativeAbandonment(
  input: ShopifyNativeAbandonmentRegistryInput,
  dependencies: ShopifyCheckoutReconciliationDependencies = {}
): Promise<ShopifyCheckoutReconciliationResult> {
  const parsedInput = nativeAbandonmentInputSchema.parse(input)

  const sessionStore =
    dependencies.sessionStore ?? redisCheckoutSessionStore

  const eventStream =
    dependencies.eventStream ?? redisCheckoutSessionEventStream

  let current = await sessionStore.getByBeginCheckoutEventId(
    parsedInput.beginCheckoutEventId
  )

  for (
    let mutationAttempt = 0;
    mutationAttempt <
    SHOPIFY_CHECKOUT_RECONCILIATION_MAX_ATTEMPTS;
    mutationAttempt += 1
  ) {
    if (!current) {
      return safeResult('missing')
    }

    if (current.state !== 'active') {
      return safeResult('session_inactive', current)
    }

    const checkoutAttempt = findShopifyAttempt(
      current,
      parsedInput.beginCheckoutEventId
    )

    if (!checkoutAttempt) {
      return safeResult('attempt_missing', current)
    }

    const existingAbandonedCheckoutId =
      checkoutAttempt.shopify.abandoned_checkout_id

    if (
      existingAbandonedCheckoutId &&
      existingAbandonedCheckoutId !==
        parsedInput.abandonedCheckoutId
    ) {
      /*
       * One begin_checkout attempt must never silently
       * switch ownership to a different Shopify native
       * AbandonedCheckout.
       */
      return safeResult(
        'abandonment_conflict',
        current,
        checkoutAttempt.attempt_id
      )
    }

    const nextStatus = nativeProviderStatus(
      checkoutAttempt.shopify.status,
      parsedInput.completedAt
    )

    const referenceAt =
      laterNullableTimestamp(
        parsedInput.updatedAt,
        parsedInput.completedAt
      ) ?? parsedInput.updatedAt

    const nextAttemptUpdatedAt = laterTimestamp(
      checkoutAttempt.last_updated_at,
      referenceAt
    )

    const nextSessionLastSeenAt = laterTimestamp(
      current.last_seen_at,
      referenceAt
    )

    const nextExpiresAt = extendSessionExpiry(
      current.expires_at,
      nextSessionLastSeenAt
    )

    const abandonedCheckoutAttached =
      existingAbandonedCheckoutId === null

    const recoveredTransition =
      checkoutAttempt.shopify.status !== 'recovered' &&
      nextStatus === 'recovered'

    const nextShopifyState: ShopifyAttemptState = {
      ...checkoutAttempt.shopify,

      status: nextStatus,

      abandoned_checkout_id: parsedInput.abandonedCheckoutId,

      private_abandoned_checkout_url: parsedInput.recoveryUrl,

      abandoned_checkout_created_at: parsedInput.createdAt,

      abandoned_checkout_updated_at: parsedInput.updatedAt,

      most_recent_step: parsedInput.mostRecentStep,

      inventory_available: parsedInput.inventoryAvailable,

      native_email_state: parsedInput.nativeEmailState,

      customer_has_no_order_since_abandonment:
        parsedInput.customerHasNoOrderSinceAbandonment,

      customer_has_no_draft_order_since_abandonment:
        parsedInput.customerHasNoDraftOrderSinceAbandonment
    }

    const providerFieldsChanged =
      JSON.stringify(checkoutAttempt.shopify) !==
      JSON.stringify(nextShopifyState)

    const changed =
      providerFieldsChanged ||
      nextAttemptUpdatedAt !== checkoutAttempt.last_updated_at ||
      nextSessionLastSeenAt !== current.last_seen_at ||
      nextExpiresAt !== current.expires_at

    if (!changed) {
      return safeResult(
        'no_change',
        current,
        checkoutAttempt.attempt_id
      )
    }

    const nextAttempts = current.checkout_attempts.map(
      candidate => {
        if (
          candidate.attempt_id !== checkoutAttempt.attempt_id
        ) {
          return candidate
        }

        return {
          ...checkoutAttempt,

          last_updated_at: nextAttemptUpdatedAt,

          shopify: nextShopifyState
        }
      }
    )

    const nextSession = checkoutSessionSchema.parse({
      ...current,

      revision: current.revision + 1,

      checkout_attempts: nextAttempts,

      last_seen_at: nextSessionLastSeenAt,

      expires_at: nextExpiresAt
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

    const journalSpecifications: JournalSpecification[] = []

    if (abandonedCheckoutAttached) {
      journalSpecifications.push({
        eventType: 'shopify_checkout.abandonment_attached',

        occurredAt: parsedInput.updatedAt,

        metadata: {
          provider_status: nextStatus,

          most_recent_step: parsedInput.mostRecentStep,

          inventory_available: parsedInput.inventoryAvailable
        }
      })
    }

    if (recoveredTransition) {
      journalSpecifications.push({
        eventType: 'shopify_checkout.recovered',

        occurredAt:
          parsedInput.completedAt ?? parsedInput.updatedAt,

        metadata: { provider_status: nextStatus }
      })
    }

    const journalStatus = await appendJournalEvents({
      eventStream,

      session: mutation.session,

      attemptId: checkoutAttempt.attempt_id,

      specifications: journalSpecifications
    })

    return safeResult(
      'updated',
      mutation.session,
      checkoutAttempt.attempt_id,
      journalStatus
    )
  }

  return safeResult('conflict_exhausted', current ?? undefined)
}
