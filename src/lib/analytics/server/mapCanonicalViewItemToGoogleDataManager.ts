import { consentedMetaAudience } from '../metaAudience'
import { protos } from '@google-ads/datamanager'
import type { CanonicalViewItem } from '../viewItemEvent'
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
  MAX_ADDITIONAL_ITEM_PARAMETERS,
  MAX_PAGE_LOCATION_LENGTH,
  MAX_PAGE_REFERRER_LENGTH,
  MAX_PAGE_TITLE_LENGTH,
  normalizeGoogleReferrerUrl,
  resolveGoogleClientId
} from './googleDataManagerSharedMapping'

type DataManagerItem =
  protos.google.ads.datamanager.v1.IItem

const {
  Event: DataManagerEvent,
  EventSource
} = protos.google.ads.datamanager.v1

function mapItem(
  item: CanonicalViewItem['custom_data']['items'][number]
): DataManagerItem {
  const additionalItemParameters = compactGoogleDataManagerParameters([
    googleDataManagerParameter('item_name', item.item_name),
    googleDataManagerParameter('item_brand', item.item_brand),
    googleDataManagerParameter('item_variant', item.item_variant),
    googleDataManagerParameter('item_category', item.item_category),
    googleDataManagerParameter('item_category2', item.item_category2),
    googleDataManagerParameter('item_category3', item.item_category3),
    googleDataManagerParameter('item_category4', item.item_category4),
    googleDataManagerParameter('item_category5', item.item_category5),
    googleDataManagerParameter('discount', item.discount),
    googleDataManagerIdentifierParameter('product_id', item.product_id),
    googleDataManagerIdentifierParameter('variant_id', item.variant_id),
    googleDataManagerParameter('product_handle', item.product_handle),
    googleDataManagerIdentifierParameter('sku', item.sku),
    googleDataManagerIdentifierParameter('gtin', item.gtin),
    googleDataManagerParameter('tax_amount', item.tax_amount),
    googleDataManagerParameter('tax_rate', item.tax_rate),
    googleDataManagerParameter('taxable', item.taxable),
    googleDataManagerParameter(
      'price_includes_tax',
      item.price_includes_tax
    ),
    googleDataManagerParameter('gross_unit_price', item.gross_unit_price),
    googleDataManagerParameter(
      'compare_at_unit_price',
      item.compare_at_unit_price
    ),
    googleDataManagerParameter(
      'gross_compare_at_unit_price',
      item.gross_compare_at_unit_price
    ),
    googleDataManagerParameter('gross_discount', item.gross_discount),
    googleDataManagerParameter(
      'available_for_sale',
      item.available_for_sale
    ),
    googleDataManagerParameter(
      'currently_not_in_stock',
      item.currently_not_in_stock
    ),
    googleDataManagerParameter('product_type', item.product_type),
    googleDataManagerParameter(
      'quantity_available',
      item.quantity_available
    )
  ]).slice(0, MAX_ADDITIONAL_ITEM_PARAMETERS)

  return {
    itemId: item.item_id,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    additionalItemParameters
  }
}

function mapEventParameters(event: CanonicalViewItem) {
  return compactGoogleDataManagerParameters([
    googleDataManagerParameter('audience', consentedMetaAudience(event)),
    googleDataManagerIdentifierParameter('event_id', event.event_id),
    googleDataManagerIdentifierParameter('page_view_id', event.page_view_id),
    googleDataManagerParameter(
      'page_location',
      limitGooglePageLocation(event.page_url),
      MAX_PAGE_LOCATION_LENGTH
    ),
    googleDataManagerParameter(
      'page_title',
      event.page_title,
      MAX_PAGE_TITLE_LENGTH
    ),
    googleDataManagerParameter(
      'page_referrer',
      normalizeGoogleReferrerUrl(event.referrer_url),
      MAX_PAGE_REFERRER_LENGTH
    ),
    googleDataManagerParameter(
      'session_id',
      event.browser_id?.ga_session_id
    )
  ])
}

export function mapCanonicalViewItemToGoogleDataManager(
  event: CanonicalViewItem
) {
  if (event.consent.analytics !== 'granted') {
    throw new Error(
      'Google Data Manager dispatch requires granted analytics consent'
    )
  }

  const marketingGranted =
    event.consent.marketing === 'granted'
  const adIdentifiers = mapGoogleDataManagerAdIdentifiers(event)
  const userData = mapGoogleDataManagerUserData(event)
  const eventDeviceInfo = mapGoogleDataManagerDeviceInfo(event)
  const eventLocation = mapGoogleDataManagerEventLocation(event)

  return DataManagerEvent.create({
    eventName: 'view_item',
    transactionId: event.event_id,
    eventTimestamp: mapGoogleDataManagerTimestamp(event.event_time),
    eventSource: EventSource.WEB,
    clientId: resolveGoogleClientId(event.browser_id),
    ...(marketingGranted && event.external_id ?
      { userId: event.external_id }
    : {}),
    currency: event.custom_data.currency,
    conversionValue: event.custom_data.value,
    consent: mapGoogleDataManagerConsent(event.consent),
    ...(adIdentifiers ?
      { adIdentifiers }
    : {}),
    ...(userData ?
      { userData }
    : {}),
    ...(eventDeviceInfo ?
      { eventDeviceInfo }
    : {}),
    ...(eventLocation ?
      { eventLocation }
    : {}),
    additionalEventParameters: mapEventParameters(event),
    cartData: {
      items: event.custom_data.items.map(mapItem)
    }
  })
}
