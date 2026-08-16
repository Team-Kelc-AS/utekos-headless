import 'server-only'

import {
  redisShopifyCartSnapshotStore,
  type ShopifyCartSnapshotStore
} from '@/lib/analytics/server/shopifyCartSnapshotStore'

import {
  CHECKOUT_SESSION_TTL_SECONDS,
  createCheckoutSession
} from './createCheckoutSession'

import {
  checkoutSessionSchema,
  checkoutSessionShopifyCartSchema,
  type CheckoutSession,
  type CheckoutSessionEnvironment,
  type CheckoutSessionLineItem,
  type CheckoutSessionShopifyCart
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

import {
  materializeCheckoutSessionCart,
  resolveCheckoutSessionCartToken
} from './materializeCheckoutSessionCart'

import type {
  Cart
} from 'types/cart'

export const CHECKOUT_SESSION_MATERIALIZATION_MAX_ATTEMPTS =
  5

export type CheckoutSessionMaterializationStore =
  Pick<
    CheckoutSessionStore,
    | 'getByCartToken'
    | 'create'
    | 'compareAndSet'
  >

export type CheckoutSessionMaterializationEventStream =
  Pick<
    CheckoutSessionEventStream,
    'append'
  >

export type CheckoutSessionMaterializationDependencies = {
  sessionStore?:
    CheckoutSessionMaterializationStore

  snapshotStore?:
    ShopifyCartSnapshotStore

  eventStream?:
    CheckoutSessionMaterializationEventStream

  now?: () => Date

  sessionIdFactory?: () => string
}

export type MaterializeCheckoutSessionFromCartResult = {
  status:
    | 'created'
    | 'updated'

  session:
    CheckoutSession

  snapshot_used:
    boolean

  journal_status:
    | 'appended'
    | 'failed'
}

function uniqueStringValue(
  values: Array<
    string | null
  >
): string | null {
  const unique =
    new Set(
      values.filter(
        (
          value
        ): value is string =>
          typeof value ===
            'string' &&
          value.length > 0
      )
    )

  if (unique.size !== 1) {
    return null
  }

  return (
    unique.values().next()
      .value ?? null
  )
}

function uniqueBooleanValue(
  values: Array<
    boolean | null
  >
): boolean | null {
  const unique =
    new Set(
      values.filter(
        (
          value
        ): value is boolean =>
          typeof value ===
          'boolean'
      )
    )

  if (unique.size !== 1) {
    return null
  }

  return (
    unique.values().next()
      .value ?? null
  )
}

function indexPreviousLinesByVariant(
  cart: CheckoutSessionShopifyCart
): Map<
  string,
  CheckoutSessionLineItem[]
> {
  const result =
    new Map<
      string,
      CheckoutSessionLineItem[]
    >()

  for (
    const line of
    cart.line_items
  ) {
    const current =
      result.get(
        line.variant_id
      ) ?? []

    current.push(line)

    result.set(
      line.variant_id,
      current
    )
  }

  return result
}

/**
 * If the legacy Shopify snapshot temporarily disappears,
 * do not throw away stable enrichment already captured by
 * an earlier Registry revision.
 *
 * Important:
 * - Storefront Cart still controls which lines exist.
 * - previous Registry state cannot add a missing line.
 * - line_key is only carried when the Storefront line_id
 *   itself still matches.
 */
function carryForwardPreviousEnrichment(
  previous:
    CheckoutSessionShopifyCart,
  next:
    CheckoutSessionShopifyCart
): CheckoutSessionShopifyCart {
  const previousByVariant =
    indexPreviousLinesByVariant(
      previous
    )

  let enrichmentCarried =
    false

  const lineItems =
    next.line_items.map(
      line => {
        const candidates =
          previousByVariant.get(
            line.variant_id
          ) ?? []

        const sameLine =
          line.line_id ?
            candidates.find(
              candidate =>
                candidate.line_id ===
                line.line_id
            )
          : undefined

        const previousSku =
          uniqueStringValue(
            candidates.map(
              candidate =>
                candidate.sku
            )
          )

        const previousTaxable =
          uniqueBooleanValue(
            candidates.map(
              candidate =>
                candidate.taxable
            )
          )

        const sku =
          line.sku ??
          previousSku

        const taxable =
          line.taxable ??
          previousTaxable

        const lineKey =
          line.line_key ??
          sameLine?.line_key ??
          null

        if (
          line.sku === null &&
          sku !== null
        ) {
          enrichmentCarried =
            true
        }

        if (
          line.taxable === null &&
          taxable !== null
        ) {
          enrichmentCarried =
            true
        }

        if (
          line.line_key === null &&
          lineKey !== null
        ) {
          enrichmentCarried =
            true
        }

        return {
          ...line,

          sku,

          taxable,

          line_key:
            lineKey
        }
      }
    )

  return checkoutSessionShopifyCartSchema.parse({
    ...next,

    source:
      next.source === 'merged' ||
      previous.source === 'merged' ||
      enrichmentCarried ?
        'merged'
      : 'storefront_api',

    line_items:
      lineItems
  })
}

function earlierTimestamp(
  left: string,
  right: string
): string {
  return (
    Date.parse(left) <=
    Date.parse(right)
  ) ?
      left
    : right
}

function laterTimestamp(
  left: string,
  right: string
): string {
  return (
    Date.parse(left) >=
    Date.parse(right)
  ) ?
      left
    : right
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

  return laterTimestamp(
    left,
    right
  )
}

function buildUpdatedSession(
  current: CheckoutSession,
  materializedCart:
    CheckoutSessionShopifyCart,
  observedAt: Date
): CheckoutSession {
  if (
    current.shopify_cart
      .cart_token !==
    materializedCart.cart_token
  ) {
    throw new Error(
      'Checkout Session cart token identity cannot change during materialization'
    )
  }

  if (
    current.shopify_cart
      .cart_gid !==
    materializedCart.cart_gid
  ) {
    throw new Error(
      'Checkout Session Shopify Cart GID cannot change during materialization'
    )
  }

  const enrichedCart =
    carryForwardPreviousEnrichment(
      current.shopify_cart,
      materializedCart
    )

  const observedAtIso =
    observedAt.toISOString()

  const lastSeenAt =
    laterTimestamp(
      current.last_seen_at,
      observedAtIso
    )

  const lastCartObservedAt =
    laterTimestamp(
      current.shopify_cart
        .last_observed_at,
      enrichedCart
        .last_observed_at
    )

  const firstCartObservedAt =
    earlierTimestamp(
      current.shopify_cart
        .first_observed_at,
      enrichedCart
        .first_observed_at
    )

  const providerUpdatedAt =
    laterNullableTimestamp(
      current.shopify_cart
        .provider_updated_at,
      enrichedCart
        .provider_updated_at
    )

  const expiryBase =
    Date.parse(lastSeenAt)

  const expiresAt =
    new Date(
      expiryBase +
        CHECKOUT_SESSION_TTL_SECONDS *
          1000
    ).toISOString()

  return checkoutSessionSchema.parse({
    ...current,

    revision:
      current.revision + 1,

    shopify_cart: {
      ...enrichedCart,

      first_observed_at:
        firstCartObservedAt,

      last_observed_at:
        lastCartObservedAt,

      provider_updated_at:
        providerUpdatedAt
    },

    last_seen_at:
      lastSeenAt,

    expires_at:
      expiresAt
  })
}

async function appendMaterializationJournal(
  input: {
    eventStream:
      CheckoutSessionMaterializationEventStream

    session:
      CheckoutSession

    status:
      | 'created'
      | 'updated'

    snapshotUsed:
      boolean

    now: () => Date
  }
): Promise<
  'appended' | 'failed'
> {
  const eventType =
    input.status === 'created' ?
      'checkout_session.created'
    : 'checkout_session.cart_materialized'

  try {
    const event =
      createCheckoutSessionEvent({
        session:
          input.session,

        eventType,

        source:
          'storefront_api',

        metadata: {
          cart_source:
            input.session
              .shopify_cart
              .source,

          line_count:
            input.session
              .shopify_cart
              .line_items
              .length,

          quantity:
            input.session
              .shopify_cart
              .total_quantity,

          currency:
            input.session
              .shopify_cart
              .total
              .currency_code,

          snapshot_used:
            input.snapshotUsed
        },

        now:
          input.now
      })

    await input.eventStream
      .append(event)

    return 'appended'
  } catch (error) {
    /**
     * The Registry state has already committed.
     *
     * Journal failure must not turn a successful
     * cart materialization into a failed checkout.
     *
     * Log only safe identifiers and the error message.
     */
    console.error(
      '[checkout-session] journal append failed',
      {
        eventType,

        sessionId:
          input.session
            .session_id,

        revision:
          input.session
            .revision,

        error:
          error instanceof Error ?
            error.message
          : 'unknown_error'
      }
    )

    return 'failed'
  }
}

function validateExistingEnvironment(
  session: CheckoutSession,
  environment:
    CheckoutSessionEnvironment
): void {
  if (
    session.environment !==
    environment
  ) {
    throw new Error(
      'Checkout Session environment cannot change during materialization'
    )
  }
}

export async function materializeCheckoutSessionFromCart(
  input: {
    cart: Cart
    environment:
      CheckoutSessionEnvironment
  },
  dependencies:
    CheckoutSessionMaterializationDependencies = {}
): Promise<MaterializeCheckoutSessionFromCartResult> {
  const sessionStore =
    dependencies.sessionStore ??
    redisCheckoutSessionStore

  const snapshotStore =
    dependencies.snapshotStore ??
    redisShopifyCartSnapshotStore

  const eventStream =
    dependencies.eventStream ??
    redisCheckoutSessionEventStream

  const now =
    dependencies.now ??
    (() => new Date())

  const observedAt =
    now()

  if (
    Number.isNaN(
      observedAt.getTime()
    )
  ) {
    throw new Error(
      'Checkout Session materialization requires a valid timestamp'
    )
  }

  const cartToken =
    resolveCheckoutSessionCartToken(
      input.cart
    )

  const snapshot =
    await snapshotStore.get(
      cartToken
    )

  const materializedCart =
    materializeCheckoutSessionCart({
      cart:
        input.cart,

      snapshot,

      observedAt
    })

  const snapshotUsed =
    snapshot !== null

  let current =
    await sessionStore
      .getByCartToken(
        cartToken
      )

  /**
   * First writer wins.
   *
   * If another request creates the Registry record
   * between getByCartToken() and create(), create()
   * returns that winner and we continue through CAS.
   */
  if (!current) {
    const candidate =
      createCheckoutSession({
        environment:
          input.environment,

        shopifyCart:
          materializedCart,

        now:
          () => observedAt,

        ...(dependencies
          .sessionIdFactory ?
          {
            sessionIdFactory:
              dependencies
                .sessionIdFactory
          }
        : {})
      })

    const created =
      await sessionStore.create(
        candidate
      )

    if (
      created.status ===
      'created'
    ) {
      const journalStatus =
        await appendMaterializationJournal({
          eventStream,

          session:
            created.session,

          status:
            'created',

          snapshotUsed,

          now:
            () => observedAt
        })

      return {
        status:
          'created',

        session:
          created.session,

        snapshot_used:
          snapshotUsed,

        journal_status:
          journalStatus
      }
    }

    current =
      created.current
  }

  for (
    let attempt = 0;
    attempt <
    CHECKOUT_SESSION_MATERIALIZATION_MAX_ATTEMPTS;
    attempt += 1
  ) {
    validateExistingEnvironment(
      current,
      input.environment
    )

    const nextSession =
      buildUpdatedSession(
        current,
        materializedCart,
        observedAt
      )

    const updated =
      await sessionStore
        .compareAndSet({
          cartToken,

          expectedRevision:
            current.revision,

          nextSession
        })

    if (
      updated.status ===
      'updated'
    ) {
      const journalStatus =
        await appendMaterializationJournal({
          eventStream,

          session:
            updated.session,

          status:
            'updated',

          snapshotUsed,

          now:
            () => observedAt
        })

      return {
        status:
          'updated',

        session:
          updated.session,

        snapshot_used:
          snapshotUsed,

        journal_status:
          journalStatus
      }
    }

    if (
      updated.status ===
      'conflict'
    ) {
      /**
       * Critical concurrency rule:
       *
       * Start the next attempt from the newest Registry
       * object so concurrent checkout_attempt/customer/
       * recovery/provider changes are never overwritten.
       */
      current =
        updated.current

      continue
    }

    /**
     * The primary key expired/disappeared between
     * read and CAS.
     *
     * Re-create safely through the same atomic create
     * primitive. We do not SET directly.
     */
    const replacement =
      createCheckoutSession({
        environment:
          input.environment,

        shopifyCart:
          materializedCart,

        now:
          () => observedAt,

        ...(dependencies
          .sessionIdFactory ?
          {
            sessionIdFactory:
              dependencies
                .sessionIdFactory
          }
        : {})
      })

    const recreated =
      await sessionStore.create(
        replacement
      )

    if (
      recreated.status ===
      'created'
    ) {
      const journalStatus =
        await appendMaterializationJournal({
          eventStream,

          session:
            recreated.session,

          status:
            'created',

          snapshotUsed,

          now:
            () => observedAt
        })

      return {
        status:
          'created',

        session:
          recreated.session,

        snapshot_used:
          snapshotUsed,

        journal_status:
          journalStatus
      }
    }

    current =
      recreated.current
  }

  throw new Error(
    `Checkout Session cart materialization exceeded ${CHECKOUT_SESSION_MATERIALIZATION_MAX_ATTEMPTS} concurrent CAS attempts`
  )
}