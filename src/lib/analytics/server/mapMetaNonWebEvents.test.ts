import assert from 'node:assert/strict'
import test from 'node:test'
import { mapMetaAppEventToServerEvent } from './mapMetaAppEventToServerEvent'
import { mapMetaBusinessMessagingEventToServerEvent } from './mapMetaBusinessMessagingEventToServerEvent'

const extinfo = [
  'i2',
  'no.utekos.app',
  '1.0',
  '100',
  '19.0',
  'iPhone17,1',
  'nb_NO',
  'CEST',
  '',
  1179,
  2556,
  '3',
  6,
  256,
  120,
  'Europe/Oslo'
] as const

type NormalizedAppEvent = {
  action_source: string
  advertiser_tracking_enabled: boolean
  app_data: {
    campaign_ids: string
    extinfo: typeof extinfo
    url_schemes: string[]
    vendor_id: string
  }
  custom_data: {
    customer_segmentation: string
  }
  opt_out: boolean
  original_event_data: {
    event_id: string
    event_name: string
    event_time: number
  }
  user_data: {
    anon_id: string
    client_ip_address: string
    client_user_agent: string
    external_id: [string, ...string[]]
    fb_login_id: string
  }
}

type NormalizedMessagingEvent = {
  action_source: string
  messaging_channel: string
  user_data: {
    ctwa_clid?: string
    page_id?: string
    page_scoped_user_id?: string
    whatsapp_business_account_id?: string
  }
}

test('maps observed app identifiers and exact app_data without inventing fields', () => {
  const normalized = mapMetaAppEventToServerEvent({
    advertiser_tracking_enabled: true,
    app_data: {
      application_tracking_enabled: true,
      campaign_ids: 'encrypted-deep-link-payload',
      extinfo,
      url_schemes: ['utekos://'],
      vendor_id: 'observed-vendor-id'
    },
    custom_data: {
      customer_segmentation: 'customer_in_loyalty_program'
    },
    event_id: 'app-purchase-1',
    event_name: 'Purchase',
    event_time: 1788256800,
    opt_out: false,
    original_event_data: {
      event_id: 'original-app-purchase-1',
      event_name: 'Purchase',
      event_time: 1788256700
    },
    user_data: {
      anon_id: 'observed-anon-id',
      client_ip_address: '2001:db8::1',
      client_user_agent: 'UtekosApp/1.0',
      external_id: 'customer-123',
      fb_login_id: '1234567890',
      fbc: 'fb.1.1788256700.observed-click',
      fbp: 'fb.1.1788256600.123456789',
      madid: 'observed-mobile-ad-id'
    }
  }).normalize() as unknown as NormalizedAppEvent

  assert.equal(normalized.action_source, 'app')
  assert.equal(normalized.advertiser_tracking_enabled, true)
  assert.equal(normalized.opt_out, false)
  assert.deepEqual(normalized.app_data.extinfo, extinfo)
  assert.deepEqual(normalized.app_data.url_schemes, [
    'utekos://'
  ])
  assert.equal(
    normalized.app_data.campaign_ids,
    'encrypted-deep-link-payload'
  )
  assert.equal(
    normalized.app_data.vendor_id,
    'observed-vendor-id'
  )
  assert.equal(
    normalized.custom_data.customer_segmentation,
    'customer_in_loyalty_program'
  )
  assert.equal(
    normalized.user_data.client_ip_address,
    '2001:db8::1'
  )
  assert.equal(
    normalized.user_data.client_user_agent,
    'UtekosApp/1.0'
  )
  assert.equal(normalized.user_data.fb_login_id, '1234567890')
  assert.equal(normalized.user_data.anon_id, 'observed-anon-id')
  assert.match(
    normalized.user_data.external_id[0],
    /^[a-f0-9]{64}\./
  )
  assert.deepEqual(normalized.original_event_data, {
    event_id: 'original-app-purchase-1',
    event_name: 'Purchase',
    event_time: 1788256700
  })
})

test('keeps WhatsApp and Messenger identifiers source-specific', () => {
  const whatsapp = mapMetaBusinessMessagingEventToServerEvent({
    event_id: 'wa-1',
    event_name: 'Purchase',
    event_time: 1788256800,
    messaging_channel: 'whatsapp',
    user_data: {
      ctwa_clid: 'observed-ctwa-click-id',
      whatsapp_business_account_id: 'observed-waba-id'
    }
  }).normalize() as unknown as NormalizedMessagingEvent
  const messenger = mapMetaBusinessMessagingEventToServerEvent({
    event_id: 'msg-1',
    event_name: 'Lead',
    event_time: 1788256800,
    messaging_channel: 'messenger',
    user_data: {
      page_id: 'observed-page-id',
      page_scoped_user_id: 'observed-psid'
    }
  }).normalize() as unknown as NormalizedMessagingEvent

  assert.equal(whatsapp.action_source, 'business_messaging')
  assert.equal(whatsapp.messaging_channel, 'whatsapp')
  assert.equal(
    whatsapp.user_data.ctwa_clid,
    'observed-ctwa-click-id'
  )
  assert.equal(
    whatsapp.user_data.whatsapp_business_account_id,
    'observed-waba-id'
  )
  assert.equal(whatsapp.user_data.page_scoped_user_id, undefined)

  assert.equal(messenger.messaging_channel, 'messenger')
  assert.equal(messenger.user_data.page_id, 'observed-page-id')
  assert.equal(
    messenger.user_data.page_scoped_user_id,
    'observed-psid'
  )
  assert.equal(messenger.user_data.ctwa_clid, undefined)
})

test('rejects incomplete source identifiers and malformed extinfo', () => {
  assert.throws(() =>
    mapMetaBusinessMessagingEventToServerEvent({
      event_id: 'wa-2',
      event_name: 'Lead',
      event_time: 1788256800,
      messaging_channel: 'whatsapp',
      user_data: { ctwa_clid: 'observed-ctwa-click-id' }
    } as never)
  )

  assert.throws(() =>
    mapMetaAppEventToServerEvent({
      advertiser_tracking_enabled: true,
      app_data: { extinfo: ['i2', 'incomplete'] },
      event_id: 'app-2',
      event_name: 'Purchase',
      event_time: 1788256800,
      user_data: {}
    } as never)
  )
})
