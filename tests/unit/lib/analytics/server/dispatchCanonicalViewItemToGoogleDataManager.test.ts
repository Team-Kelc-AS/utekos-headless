import assert from 'node:assert/strict'
import test from 'node:test'
import { protos } from '@google-ads/datamanager'
import {
  createCanonicalViewItem,
  type CanonicalViewItem,
  type CanonicalViewItemCommerce
} from '@/lib/analytics/viewItemEvent'
import {
  dispatchCanonicalViewItemToGoogleDataManager,
  type GoogleDataManagerViewItemDispatchDependencies
} from '@/lib/analytics/server/dispatchCanonicalViewItemToGoogleDataManager'

const { Event: DataManagerEvent } =
  protos.google.ads.datamanager.v1

const commerce = {
  currency: 'NOK',
  value: 799.2,
  gross_value: 999,
  tax_value: 199.8,
  items: [
    {
      item_id: 'gid://shopify/ProductVariant/123',
      product_id: 'gid://shopify/Product/456',
      variant_id: 'gid://shopify/ProductVariant/123',
      item_name: 'Comfyrobe™',
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
      quantity_available: 20,
      selected_options: [],
      collection_ids: [],
      collection_titles: []
    }
  ]
} satisfies CanonicalViewItemCommerce

function viewItem(): CanonicalViewItem {
  return createCanonicalViewItem({
    browserId: {
      ga_client_id: '97245370.1784201643',
      ga_session_id: '1784201643'
    },
    commerce,
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'granted',
      source: 'cookiebot',
      version: '1'
    },
    environment: 'test',
    eventId:
      '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    eventTime: '2026-07-16T10:00:00.123Z',
    pageTitle: 'Comfyrobe™ | Utekos',
    pageUrl:
      'https://utekos.no/produkter/comfyrobe',
    pageViewId:
      'ed4fb82a-f2f2-41f9-978a-3f99cf64ec2f'
  })
}

test('maps and sends one canonical view_item through Data Manager', async () => {
  const canonicalEvent = viewItem()

  const dataManagerEvent =
    DataManagerEvent.create({
      clientId: '97245370.1784201643',
      eventName: 'view_item'
    })

  const config = {
    propertyId: '123456789',
    validateOnly: true
  }

  let mappedInput: CanonicalViewItem | undefined

  let sentInput:
    | {
        config: typeof config
        event:
          protos.google.ads.datamanager.v1.Event
      }
    | undefined

  const dependencies:
    GoogleDataManagerViewItemDispatchDependencies = {
      mapEvent: event => {
        mappedInput = event
        return dataManagerEvent
      },
      readConfig: () => config,
      sendEvent: async (
        event,
        currentConfig
      ) => {
        sentInput = {
          config: currentConfig,
          event
        }

        return {
          validateOnly: true
        }
      }
    }

  const receipt =
    await dispatchCanonicalViewItemToGoogleDataManager(
      canonicalEvent,
      dependencies
    )

  assert.equal(mappedInput, canonicalEvent)

  assert.deepEqual(sentInput, {
    config,
    event: dataManagerEvent
  })

  assert.deepEqual(receipt, {
    eventId: canonicalEvent.event_id,
    eventName: 'view_item',
    provider: 'google_data_manager',
    result: {
      validateOnly: true
    }
  })
})

test('does not read configuration or send when mapping fails', async () => {
  let readConfigCalled = false
  let sendCalled = false

  await assert.rejects(
    dispatchCanonicalViewItemToGoogleDataManager(
      viewItem(),
      {
        mapEvent: () => {
          throw new Error(
            'analytics consent granted'
          )
        },
        readConfig: () => {
          readConfigCalled = true

          return {
            propertyId: '123456789',
            validateOnly: true
          }
        },
        sendEvent: async () => {
          sendCalled = true

          return {
            validateOnly: true
          }
        }
      }
    ),
    /analytics consent granted/
  )

  assert.equal(readConfigCalled, false)
  assert.equal(sendCalled, false)
})