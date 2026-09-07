import {
  canonicalAddPaymentInfoSchema,
  deterministicAddPaymentInfoEventId,
  type CanonicalAddPaymentInfo
} from '../addPaymentInfoEvent'
import {
  canonicalBeginCheckoutSchema,
  type CanonicalBeginCheckout
} from '../beginCheckoutEvent'
import type { CanonicalEventEnvelope } from '../canonicalEventEnvelope'
import type { ShopifyCheckoutObservation } from '../shopifyCheckoutObservationContract'
import type { CanonicalEventStore } from './canonicalEventStore'
import { logCanonicalCommerceEvent } from '@/lib/observability/logging/logCanonicalCommerceEvent'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'
import type { ShopifyAddPaymentInfoCanonicalConfig } from './shopifyAddPaymentInfoCanonicalConfig'
import {
  assertCompatibleCheckoutProgressSource,
  checkoutProgressCanonicalEnvelope
} from './shopifyCheckoutProgressCanonicalSource'

type PromotionStore = CanonicalEventStore & {
  find: NonNullable<CanonicalEventStore['find']>
}

type Dependencies = {
  config: ShopifyAddPaymentInfoCanonicalConfig
  environment: CanonicalEventEnvelope['environment']
  now?: () => Date
  store: PromotionStore
}

export type ShopifyAddPaymentInfoPromotionResult = {
  eventId?: string
  status: 'duplicate' | 'inserted' | 'not_applicable'
}

export async function promoteShopifyAddPaymentInfoObservation(
  observation: ShopifyCheckoutObservation,
  dependencies: Dependencies
): Promise<ShopifyAddPaymentInfoPromotionResult> {
  if (
    !dependencies.config.enabled ||
    observation.schemaVersion !== 2 ||
    observation.eventName !== 'payment_info_submitted' ||
    !observation.privacy.analyticsProcessingAllowed ||
    Date.parse(observation.occurredAt) <
      Date.parse(dependencies.config.cutoverAt)
  ) {
    return { status: 'not_applicable' }
  }

  const source = await dependencies.store.find({
    event_id: observation.correlation.beginCheckoutEventId,
    event_name: 'begin_checkout'
  })

  if (!source) {
    throw new Error('canonical_begin_checkout_not_ready')
  }

  const beginCheckout =
    canonicalBeginCheckoutSchema.parse(source)
  assertCompatibleCheckoutProgressSource(
    observation,
    beginCheckout,
    dependencies.environment
  )

  const event = mapObservationToCanonicalAddPaymentInfo(
    observation,
    beginCheckout,
    dependencies.environment
  )
  const accepted = await dependencies.store.accept({
    dispatches: planCanonicalEventDispatch(event),
    event,
    sourceEvidence: {
      canonical_event_id: event.event_id,
      source_system: 'shopify',
      source_method: 'web_pixel',
      source_object_type: 'checkout',
      source_object_id: observation.checkoutToken,
      source_topic: 'payment_info_submitted',
      source_delivery_id: null,
      source_event_id: observation.eventId,
      source_api_version: '2026-04',
      source_triggered_at: observation.occurredAt,
      source_observed_at: (
        dependencies.now ?? (() => new Date())
      )().toISOString()
    }
  })

  await logCanonicalCommerceEvent({
    event,
    eventName: 'add_payment_info',
    source: 'shopify_web_pixel',
    status:
      accepted.status === 'inserted' ? 'accepted' : 'duplicate'
  })

  return { eventId: event.event_id, status: accepted.status }
}

export function mapObservationToCanonicalAddPaymentInfo(
  observation: Extract<
    ShopifyCheckoutObservation,
    { schemaVersion: 2 }
  >,
  beginCheckout: CanonicalBeginCheckout,
  environment: CanonicalEventEnvelope['environment']
): CanonicalAddPaymentInfo {
  return canonicalAddPaymentInfoSchema.parse({
    schema_version: 1,
    event_name: 'add_payment_info',
    event_id: deterministicAddPaymentInfoEventId(
      observation.eventId
    ),
    event_time: observation.occurredAt,
    source: 'web',
    environment,
    ...checkoutProgressCanonicalEnvelope(
      observation,
      beginCheckout
    ),
    custom_data: {
      currency: beginCheckout.custom_data.currency,
      value: beginCheckout.custom_data.value,
      gross_value: beginCheckout.custom_data.gross_value,
      tax_value: beginCheckout.custom_data.tax_value,
      items: beginCheckout.custom_data.items,
      checkout_id: observation.checkoutToken,
      payment_revision: observation.eventId,
      begin_checkout_event_id:
        observation.correlation.beginCheckoutEventId
    }
  })
}
