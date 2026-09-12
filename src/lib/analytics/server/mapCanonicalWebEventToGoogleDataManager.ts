import { consentedMetaAudience } from '../metaAudience'
import { protos } from '@google-ads/datamanager'
import type { CanonicalCommerceItem } from '../canonicalCommerceItem'
import type { CanonicalEventEnvelope } from '../canonicalEventEnvelope'
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

type DataManagerItem = protos.google.ads.datamanager.v1.IItem

const {
  Event: DataManagerEvent,
  EventSource
} = protos.google.ads.datamanager.v1

type WebEventCustomData = Record<
  string,
  string | number | boolean | CanonicalCommerceItem[] | null | undefined
>

type GoogleWebEvent = CanonicalEventEnvelope & {
  page_url?: string | undefined
  page_title?: string | undefined
  referrer_url?: string | undefined
  page_view_id?: string | undefined
  custom_data: WebEventCustomData
}

function mapItem(item: CanonicalCommerceItem): DataManagerItem {
  const additionalItemParameters = compactGoogleDataManagerParameters([
    googleDataManagerParameter('item_name', item.item_name),
    googleDataManagerParameter('item_brand', item.item_brand),
    googleDataManagerParameter('item_variant', item.item_variant),
    googleDataManagerParameter('item_category', item.item_category),
    googleDataManagerParameter('discount', item.discount),
    googleDataManagerIdentifierParameter('product_id', item.product_id),
    googleDataManagerIdentifierParameter('variant_id', item.variant_id),
    googleDataManagerParameter('product_handle', item.product_handle),
    googleDataManagerIdentifierParameter('sku', item.sku)
  ]).slice(0, MAX_ADDITIONAL_ITEM_PARAMETERS)

  return {
    itemId: item.item_id,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    additionalItemParameters
  }
}

function mapCustomDataParameters(customData: WebEventCustomData) {
  const parameters: Array<
    ReturnType<typeof googleDataManagerParameter>
  > = []

  for (const [key, value] of Object.entries(customData)) {
    if (key === 'items') continue
    if (Array.isArray(value)) continue

    const parameter = googleDataManagerParameter(key, value)
    if (parameter) parameters.push(parameter)
  }

  return compactGoogleDataManagerParameters(parameters)
}

function resolveCommerceFields(customData: WebEventCustomData) {
  const items = customData.items
  const currency =
    typeof customData.currency === 'string' ?
      customData.currency
    : undefined
  const value =
    typeof customData.value === 'number' ? customData.value : undefined

  if (!Array.isArray(items) || items.length === 0) {
    return {
      ...(currency ? { currency } : {}),
      ...(value === undefined ? {} : { conversionValue: value })
    }
  }

  return {
    ...(currency ? { currency } : {}),
    ...(value === undefined ? {} : { conversionValue: value }),
    cartData: {
      items: (items as CanonicalCommerceItem[]).map(mapItem)
    }
  }
}

export function mapCanonicalWebEventToGoogleDataManager(
  event: GoogleWebEvent,
  googleEventName: string
) {
  if (event.consent.analytics !== 'granted') {
    throw new Error(
      'Google Data Manager dispatch requires granted analytics consent'
    )
  }

  const marketingGranted = event.consent.marketing === 'granted'
  const adIdentifiers = mapGoogleDataManagerAdIdentifiers(event)
  const userData = mapGoogleDataManagerUserData(event)
  const eventDeviceInfo = mapGoogleDataManagerDeviceInfo(event)
  const eventLocation = mapGoogleDataManagerEventLocation(event)
  const commerceFields = resolveCommerceFields(event.custom_data)

  return DataManagerEvent.create({
    eventName: googleEventName,
    transactionId: event.event_id,
    eventTimestamp: mapGoogleDataManagerTimestamp(event.event_time),
    eventSource: EventSource.WEB,
    clientId: resolveGoogleClientId(event.browser_id),
    ...(marketingGranted && event.external_id ?
      { userId: event.external_id }
    : {}),
    consent: mapGoogleDataManagerConsent(event.consent),
    ...(adIdentifiers ? { adIdentifiers } : {}),
    ...(userData ? { userData } : {}),
    ...(eventDeviceInfo ? { eventDeviceInfo } : {}),
    ...(eventLocation ? { eventLocation } : {}),
    ...commerceFields,
    additionalEventParameters: compactGoogleDataManagerParameters([
      googleDataManagerParameter('audience', consentedMetaAudience(event)),
      googleDataManagerIdentifierParameter('event_id', event.event_id),
      googleDataManagerIdentifierParameter(
        'page_view_id',
        event.page_view_id
      ),
      googleDataManagerParameter(
        'page_location',
        event.page_url ?
          limitGooglePageLocation(event.page_url)
        : undefined,
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
      ),
      ...mapCustomDataParameters(event.custom_data)
    ])
  })
}
