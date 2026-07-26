import { protos } from '@google-ads/datamanager'
import type { CanonicalPurchase } from '../purchaseEvent'
import {
  compactGoogleDataManagerParameters,
  googleDataManagerIdentifierParameter,
  googleDataManagerParameter,
  limitGooglePageLocation,
  mapGoogleDataManagerAdIdentifiers,
  mapGoogleDataManagerConsent,
  mapGoogleDataManagerDeviceInfo,
  mapGoogleDataManagerEventLocation,
  mapGoogleDataManagerTimestamp,
  mapGoogleDataManagerUserData,
  normalizeGoogleReferrerUrl
} from './googleDataManagerSharedMapping'
import { findGoogleClientId } from './findGoogleClientId'

type DataManagerItem = protos.google.ads.datamanager.v1.IItem

const MAX_ADDITIONAL_ITEM_PARAMETERS = 24
const { Event: DataManagerEvent, EventSource } =
  protos.google.ads.datamanager.v1

function mapPurchaseItem(
  item: CanonicalPurchase['custom_data']['items'][number]
): DataManagerItem {
  const additionalItemParameters =
    compactGoogleDataManagerParameters([
      googleDataManagerParameter('item_name', item.item_name),
      googleDataManagerIdentifierParameter('sku', item.sku),
      googleDataManagerParameter('discount', item.discount)
    ]).slice(0, MAX_ADDITIONAL_ITEM_PARAMETERS)

  return {
    itemId: item.item_id,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    additionalItemParameters
  }
}

function mapPurchaseEventParameters(event: CanonicalPurchase) {
  return compactGoogleDataManagerParameters([
    googleDataManagerIdentifierParameter(
      'event_id',
      event.event_id
    ),
    googleDataManagerIdentifierParameter(
      'transaction_id',
      event.custom_data.transaction_id
    ),
    googleDataManagerParameter(
      'order_name',
      event.custom_data.order_name
    ),
    googleDataManagerParameter(
      'tax',
      event.custom_data.tax_value
    ),
    googleDataManagerParameter(
      'shipping',
      event.custom_data.shipping_value
    ),
    googleDataManagerParameter(
      'page_location',
      event.page_url ?
        limitGooglePageLocation(event.page_url)
      : undefined
    ),
    googleDataManagerParameter(
      'page_referrer',
      normalizeGoogleReferrerUrl(event.referrer_url)
    ),
    googleDataManagerParameter(
      'session_id',
      event.browser_id?.ga_session_id
    )
  ])
}

export function mapCanonicalPurchaseToGoogleDataManager(
  event: CanonicalPurchase
) {
  if (event.consent.analytics !== 'granted') {
    throw new Error(
      'Google Data Manager dispatch requires granted analytics consent'
    )
  }

  const marketingGranted = event.consent.marketing === 'granted'
  const clientId = findGoogleClientId(event.browser_id)
  const adIdentifiers = mapGoogleDataManagerAdIdentifiers(event)
  const userId =
    marketingGranted && event.external_id ?
      event.external_id
    : undefined
  const userData = mapGoogleDataManagerUserData(event)
  const eventDeviceInfo = mapGoogleDataManagerDeviceInfo(event)
  const eventLocation = mapGoogleDataManagerEventLocation(event)

  if (!clientId && !adIdentifiers?.gclid && !userId) {
    throw new Error(
      'Google Data Manager purchase requires clientId, GCLID, or User-ID'
    )
  }
  if (!event.custom_data.transaction_id.trim()) {
    throw new Error(
      'Google Data Manager purchase requires transactionId'
    )
  }
  if (event.custom_data.items.length === 0) {
    throw new Error(
      'Google Data Manager purchase requires non-empty cartData.items'
    )
  }

  return DataManagerEvent.create({
    eventName: 'purchase',
    transactionId: event.custom_data.transaction_id,
    eventTimestamp: mapGoogleDataManagerTimestamp(
      event.event_time
    ),
    eventSource: EventSource.WEB,
    ...(clientId ? { clientId } : {}),
    ...(userId ? { userId } : {}),
    currency: event.custom_data.currency,
    conversionValue:
      event.custom_data.item_revenue ?? event.custom_data.value,
    consent: mapGoogleDataManagerConsent(event.consent),
    ...(adIdentifiers ? { adIdentifiers } : {}),
    ...(userData ? { userData } : {}),
    ...(eventDeviceInfo ? { eventDeviceInfo } : {}),
    ...(eventLocation ? { eventLocation } : {}),
    additionalEventParameters: mapPurchaseEventParameters(event),
    cartData: {
      ...(event.custom_data.transaction_discount === undefined ?
        {}
      : {
          transactionDiscount:
            event.custom_data.transaction_discount
        }),
      ...(event.custom_data.coupon_codes?.[0] ?
        { couponCodes: [event.custom_data.coupon_codes[0]] }
      : {}),
      items: event.custom_data.items.map(mapPurchaseItem)
    }
  })
}
