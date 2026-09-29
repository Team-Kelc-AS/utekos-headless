import {
  canonicalPurchaseSchema,
  deterministicPurchaseEventId,
  shopifyPurchaseTransactionId,
  type CanonicalPurchase
} from '../purchaseEvent'
import type {
  ShopifyCheckoutObservation,
  ShopifyCheckoutPurchaseObservation
} from '../shopifyCheckoutObservationContract'
import type { CanonicalEventStore } from './canonicalEventStore'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'
import type { ProviderId } from './providerAdapter'

type PromotionStore = CanonicalEventStore & {
  find: NonNullable<CanonicalEventStore['find']>
}

type Dependencies = { now?: () => Date; store: PromotionStore }

export type ShopifyCheckoutPurchasePromotionResult = {
  eventId?: string
  status: 'duplicate' | 'inserted' | 'not_applicable'
}

const MONEY_TOLERANCE = 0.01 + Number.EPSILON

function moneyMatches(left: number, right: number) {
  return Math.abs(left - right) <= MONEY_TOLERANCE
}

function itemQuantities(
  items: ReadonlyArray<{ itemId: string; quantity: number }>
) {
  const quantities = new Map<string, number>()

  for (const item of items) {
    quantities.set(
      item.itemId,
      (quantities.get(item.itemId) ?? 0) + item.quantity
    )
  }

  return quantities
}

function canonicalItemQuantities(event: CanonicalPurchase) {
  return itemQuantities(
    event.custom_data.items.map(item => ({
      itemId: item.item_id,
      quantity: item.quantity
    }))
  )
}

function observationMatchesCanonicalPurchase(
  observation: ShopifyCheckoutPurchaseObservation,
  event: CanonicalPurchase
) {
  if (
    event.custom_data.transaction_id !==
      shopifyPurchaseTransactionId(observation.orderLegacyId) ||
    event.custom_data.currency !==
      observation.commerce.currencyCode ||
    !moneyMatches(
      event.custom_data.value,
      observation.commerce.value
    )
  ) {
    return false
  }

  const canonicalQuantity = event.custom_data.items.reduce(
    (total, item) => total + item.quantity,
    0
  )

  if (canonicalQuantity !== observation.commerce.itemQuantity) {
    return false
  }

  const observedItems = itemQuantities(
    observation.commerce.items
  )
  const canonicalItems = canonicalItemQuantities(event)

  if (observedItems.size !== canonicalItems.size) {
    return false
  }

  for (const [itemId, quantity] of observedItems) {
    if (canonicalItems.get(itemId) !== quantity) {
      return false
    }
  }

  return true
}

function activePurchaseProviders(
  observation: ShopifyCheckoutPurchaseObservation
) {
  const providers: ProviderId[] = []

  if (observation.privacy.analyticsProcessingAllowed) {
    providers.push('google')
  }

  if (
    observation.privacy.marketingAllowed &&
    observation.privacy.saleOfDataAllowed
  ) {
    providers.push('meta')
  }

  return providers
}

/**
 * Corroborate the App Web Pixel completion against the immutable paid-order
 * Purchase before it may release provider work. The public observation never
 * creates payment truth and can only fill missing Meta or Google outbox rows.
 */
export async function promoteShopifyCheckoutPurchaseObservation(
  observation: ShopifyCheckoutObservation,
  dependencies: Dependencies
): Promise<ShopifyCheckoutPurchasePromotionResult> {
  if (
    observation.schemaVersion !== 4 ||
    observation.eventName !== 'checkout_completed'
  ) {
    return { status: 'not_applicable' }
  }

  const eventId = deterministicPurchaseEventId(
    observation.orderLegacyId
  )
  const stored = await dependencies.store.find({
    event_id: eventId,
    event_name: 'purchase'
  })

  if (!stored) {
    throw new Error('canonical_purchase_not_ready')
  }

  const purchase = canonicalPurchaseSchema.parse(stored)

  if (
    !observationMatchesCanonicalPurchase(observation, purchase)
  ) {
    return { status: 'not_applicable' }
  }

  const providerAllowlist = activePurchaseProviders(observation)
  const dispatches = planCanonicalEventDispatch(purchase).filter(
    dispatch => providerAllowlist.includes(dispatch.provider)
  )

  const accepted = await dependencies.store.accept({
    event: purchase,
    dispatches,
    ...(providerAllowlist.length > 0 ?
      { releaseProvidersOnDuplicate: providerAllowlist }
    : {}),
    sourceEvidence: {
      canonical_event_id: purchase.event_id,
      source_system: 'shopify',
      source_method: 'web_pixel',
      source_object_type: 'order',
      source_object_id: observation.orderLegacyId,
      source_topic: 'checkout_completed',
      source_delivery_id: null,
      source_event_id: observation.eventId,
      source_api_version: '2026-04',
      source_triggered_at: observation.occurredAt,
      source_observed_at: (
        dependencies.now ?? (() => new Date())
      )().toISOString()
    }
  })

  return { eventId: purchase.event_id, status: accepted.status }
}
