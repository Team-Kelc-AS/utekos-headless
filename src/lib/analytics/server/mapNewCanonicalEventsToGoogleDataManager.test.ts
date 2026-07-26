import assert from 'node:assert/strict'
import test from 'node:test'
import { protos } from '@google-ads/datamanager'
import { createCanonicalInteractWithAccordion } from '../interactWithAccordionEvent'
import { createCanonicalOpenQuickView } from '../openQuickViewEvent'
import type { CanonicalCommerceItem } from '../canonicalCommerceItem'
import { mapCanonicalInteractWithAccordionToGoogleDataManager } from './mapCanonicalInteractWithAccordionToGoogleDataManager'
import { mapCanonicalOpenQuickViewToGoogleDataManager } from './mapCanonicalOpenQuickViewToGoogleDataManager'

const { Event: DataManagerEvent } =
  protos.google.ads.datamanager.v1

const item: CanonicalCommerceItem = {
  item_id: 'gid://shopify/ProductVariant/1',
  product_id: 'gid://shopify/Product/1',
  variant_id: 'gid://shopify/ProductVariant/1',
  item_name: 'Comfyrobe',
  item_brand: 'Utekos',
  product_handle: 'comfyrobe',
  quantity: 1,
  unit_price: 799.2,
  gross_unit_price: 999,
  tax_amount: 199.8,
  tax_rate: 0.25,
  taxable: true,
  price_includes_tax: true,
  available_for_sale: true,
  currently_not_in_stock: false,
  quantity_available: 12,
  selected_options: [],
  collection_ids: [],
  collection_titles: []
}

const commonInput = {
  browserId: {
    ga_cookie: 'GA1.1.97245370.1784201643',
    ga_session_id: '1784201643'
  },
  consent: {
    analytics: 'granted' as const,
    marketing: 'denied' as const,
    preferences: 'denied' as const,
    source: 'cookiebot' as const,
    version: '1'
  },
  environment: 'test' as const,
  eventTime: '2026-07-26T10:00:00.123Z',
  pageTitle: 'Comfyrobe | Utekos',
  pageUrl: 'https://utekos.no/produkter/comfyrobe',
  pageViewId: 'ed4fb82a-f2f2-41f9-978a-3f99cf64ec2f'
}

function normalize(
  event: protos.google.ads.datamanager.v1.Event
) {
  assert.equal(DataManagerEvent.verify(event), null)

  return DataManagerEvent.toObject(event, {
    defaults: false,
    enums: String,
    longs: Number
  })
}

function parameterMap(
  event: ReturnType<typeof normalize>
) {
  const parameters = (event.additionalEventParameters ?? []) as Array<{
    parameterName?: string
    value?: string
  }>

  return Object.fromEntries(
    parameters.map((parameter) => [
      parameter.parameterName,
      parameter.value
    ])
  )
}

test('maps open_quick_view with canonical commerce and interaction context', () => {
  const eventId = '61c2ef59-6e6f-4f56-a63a-567ca398f9de'
  const mapped = normalize(
    mapCanonicalOpenQuickViewToGoogleDataManager(
      createCanonicalOpenQuickView({
        ...commonInput,
        eventId,
        customData: {
          currency: 'NOK',
          value: 799.2,
          gross_value: 999,
          tax_value: 199.8,
          items: [item],
          open_sequence: 2,
          source_surface: 'homepage_featured_products'
        }
      })
    )
  )

  assert.equal(mapped.eventName, 'open_quick_view')
  assert.equal(mapped.transactionId, eventId)
  assert.equal(mapped.currency, 'NOK')
  assert.equal(mapped.conversionValue, 799.2)
  assert.equal(mapped.cartData?.items?.[0]?.itemId, item.item_id)
  assert.equal(mapped.userId, undefined)
  assert.equal(mapped.adIdentifiers, undefined)
  assert.deepEqual(parameterMap(mapped), {
    event_id: eventId,
    page_view_id: commonInput.pageViewId,
    page_location: commonInput.pageUrl,
    page_title: commonInput.pageTitle,
    session_id: commonInput.browserId.ga_session_id,
    currency: 'NOK',
    value: '799.2',
    gross_value: '999',
    tax_value: '199.8',
    open_sequence: '2',
    source_surface: 'homepage_featured_products'
  })
})

test('maps interact_with_accordion with exact interaction fields', () => {
  const eventId = 'd1cc9383-63ca-4f43-9183-031e996493a0'
  const mapped = normalize(
    mapCanonicalInteractWithAccordionToGoogleDataManager(
      createCanonicalInteractWithAccordion({
        ...commonInput,
        eventId,
        customData: {
          currency: 'NOK',
          value: 799.2,
          gross_value: 999,
          tax_value: 199.8,
          items: [item],
          accordion_id: 'details',
          accordion_title: 'Produktdetaljer',
          interaction_sequence: 3,
          interaction_type: 'open'
        }
      })
    )
  )

  const parameters = parameterMap(mapped)

  assert.equal(mapped.eventName, 'interact_with_accordion')
  assert.equal(mapped.transactionId, eventId)
  assert.equal(parameters.accordion_id, 'details')
  assert.equal(parameters.accordion_title, 'Produktdetaljer')
  assert.equal(parameters.interaction_sequence, '3')
  assert.equal(parameters.interaction_type, 'open')
})
