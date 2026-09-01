import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertMetaAppendAttributionIsSendable,
  getObservedMetaFbcCreationTimestamp,
  type MetaAppendAttributionEvent
} from '../metaAppendAttributionContract'
import {
  calculateMetaAppendAttributionValue,
  mapMetaAppendAttributionEventToServerEvent
} from './mapMetaAppendAttributionEventToServerEvent'

const touchpointTime = 1788255000
const originalEventTime = 1788256000
const appendEventTime = 1788257000

const iosExtinfo = [
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

const androidExtinfo = [
  'a2',
  'no.utekos.app',
  '1.0',
  '100',
  '16',
  'Pixel 10',
  'nb_NO',
  'CEST',
  '',
  1080,
  2400,
  '3',
  8,
  256,
  120,
  'Europe/Oslo'
] as const

const webEvent: MetaAppendAttributionEvent = {
  action_source: 'website',
  attribution_data: {
    ad_id: '120312345678901234',
    attribution_share: 0.25,
    touchpoint_ts: touchpointTime
  },
  conversion_value: 1790,
  custom_data: { currency: 'NOK' },
  event_id: 'append-order-1001-ad-120312345678901234',
  event_name: 'AppendAttribution',
  event_source_url: 'https://utekos.no/takk-for-kjop',
  event_time: appendEventTime,
  marketing_consent: 'granted',
  opt_out: false,
  original_event_data: {
    event_name: 'Purchase',
    event_time: originalEventTime,
    order_id: 'order-1001'
  },
  referrer_url: 'https://utekos.no/handlekurv',
  user_data: {
    client_ip_address: '2001:db8::1',
    client_user_agent: 'Mozilla/5.0',
    external_id: 'customer-1001',
    fb_login_id: '1234567890',
    fbc: 'fb.1.1788255000000.observed-click.ABcDEFGh',
    fbp: 'fb.1.1788254900000.123456789.ABcDEFGh'
  }
}

type NormalizedAppendAttribution = {
  action_source: string
  advertiser_tracking_enabled?: boolean
  app_data?: {
    advertiser_tracking_enabled: number
    application_tracking_enabled: number
    campaign_ids: string
    extinfo: typeof iosExtinfo
    url_schemes: string[]
    vendor_id: string
  }
  attribution_data: {
    ad_id: string
    attribution_share: number
    attribution_value: number
    touchpoint_ts: number
  }
  custom_data: { currency: string }
  event_id: string
  event_name: string
  event_source_url?: string
  event_time: number
  opt_out: boolean
  original_event_data: {
    event_name: string
    event_time: number
    order_id: string
  }
  referrer_url?: string
  user_data: {
    client_ip_address?: string
    client_user_agent?: string
    external_id?: [string, ...string[]]
    fb_login_id?: string
    fbc?: string
    fbp?: string
    madid?: string
  }
}

test('maps a consented website attribution passback with exact match keys', () => {
  const normalized =
    mapMetaAppendAttributionEventToServerEvent(
      webEvent
    ).normalize() as unknown as NormalizedAppendAttribution

  assert.equal(normalized.event_name, 'AppendAttribution')
  assert.equal(normalized.action_source, 'website')
  assert.equal(normalized.event_source_url, webEvent.event_source_url)
  assert.equal(normalized.referrer_url, webEvent.referrer_url)
  assert.equal(normalized.opt_out, false)
  assert.deepEqual(normalized.attribution_data, {
    ad_id: '120312345678901234',
    attribution_share: 0.25,
    attribution_value: 447.5,
    touchpoint_ts: touchpointTime
  })
  assert.deepEqual(normalized.custom_data, { currency: 'NOK' })
  assert.deepEqual(normalized.original_event_data, {
    event_name: 'Purchase',
    event_time: originalEventTime,
    order_id: 'order-1001'
  })
  assert.equal(normalized.user_data.fbc, webEvent.user_data.fbc)
  assert.equal(normalized.user_data.fbp, webEvent.user_data.fbp)
  assert.equal(
    normalized.user_data.client_ip_address,
    '2001:db8::1'
  )
  assert.equal(
    normalized.user_data.client_user_agent,
    'Mozilla/5.0'
  )
  assert.equal(normalized.user_data.fb_login_id, '1234567890')
  assert.match(
    normalized.user_data.external_id?.[0] ?? '',
    /^[a-f0-9]{64}\./u
  )
})

test('maps iOS attribution app_data and preserves disabled tracking flags', () => {
  const event: MetaAppendAttributionEvent = {
    action_source: 'app',
    advertiser_tracking_enabled: false,
    app_data: {
      application_tracking_enabled: false,
      campaign_ids: 'encrypted-ios-campaign-ids',
      extinfo: iosExtinfo,
      url_schemes: ['utekos://'],
      vendor_id: 'observed-ios-vendor-id'
    },
    attribution_data: {
      ad_id: '120312345678901234',
      attribution_share: 1,
      touchpoint_ts: touchpointTime
    },
    conversion_value: 1790,
    custom_data: { currency: 'NOK' },
    event_id: 'append-app-order-1001',
    event_name: 'AppendAttribution',
    event_time: appendEventTime,
    marketing_consent: 'granted',
    original_event_data: {
      event_name: 'fb_mobile_purchase',
      event_time: originalEventTime,
      order_id: 'app-order-1001'
    },
    user_data: {
      client_ip_address: '2001:db8::2',
      fbc: 'fb.1.1788255000000.observed-app-click.ABcDEFGh'
    }
  }
  const normalized =
    mapMetaAppendAttributionEventToServerEvent(
      event
    ).normalize() as unknown as NormalizedAppendAttribution

  assert.equal(normalized.action_source, 'app')
  assert.equal(normalized.advertiser_tracking_enabled, false)
  assert.equal(
    normalized.app_data?.advertiser_tracking_enabled,
    0
  )
  assert.equal(
    normalized.app_data?.application_tracking_enabled,
    0
  )
  assert.deepEqual(normalized.app_data?.extinfo, iosExtinfo)
  assert.deepEqual(normalized.app_data?.url_schemes, [
    'utekos://'
  ])
  assert.equal(
    normalized.app_data?.campaign_ids,
    'encrypted-ios-campaign-ids'
  )
  assert.equal(
    normalized.app_data?.vendor_id,
    'observed-ios-vendor-id'
  )
  assert.equal(normalized.attribution_data.attribution_value, 1790)
})

test('retains a zero attribution share instead of dropping it', () => {
  const normalized =
    mapMetaAppendAttributionEventToServerEvent({
      ...webEvent,
      attribution_data: {
        ...webEvent.attribution_data,
        attribution_share: 0
      },
      event_id: 'append-zero-credit'
    }).normalize() as unknown as NormalizedAppendAttribution

  assert.equal(normalized.attribution_data.attribution_share, 0)
  assert.equal(normalized.attribution_data.attribution_value, 0)
})

test('extracts only the observed millisecond timestamp from valid fbc values', () => {
  assert.equal(
    getObservedMetaFbcCreationTimestamp(
      'fb.1.1788255000123.observed-click.ABcDEFGh'
    ),
    1788255000
  )
  assert.equal(
    getObservedMetaFbcCreationTimestamp(
      'fb.1.1788255000.seconds-are-not-valid'
    ),
    undefined
  )
  assert.equal(
    getObservedMetaFbcCreationTimestamp('malformed'),
    undefined
  )
})

test('rejects invalid attribution ordering and a late send', () => {
  assert.throws(() =>
    mapMetaAppendAttributionEventToServerEvent({
      ...webEvent,
      attribution_data: {
        ...webEvent.attribution_data,
        touchpoint_ts: originalEventTime
      }
    })
  )

  assert.throws(
    () =>
      assertMetaAppendAttributionIsSendable(
        webEvent,
        originalEventTime + 48 * 60 * 60 + 1
      ),
    /exceeded 48 hours/u
  )
})

test('requires iOS campaign_ids and Android madid', () => {
  const commonAppEvent = {
    action_source: 'app',
    advertiser_tracking_enabled: true,
    attribution_data: {
      ad_id: '120312345678901234',
      attribution_share: 1,
      touchpoint_ts: touchpointTime
    },
    conversion_value: 1790,
    custom_data: { currency: 'NOK' },
    event_id: 'append-app-invalid',
    event_name: 'AppendAttribution',
    event_time: appendEventTime,
    marketing_consent: 'granted',
    original_event_data: {
      event_name: 'fb_mobile_purchase',
      event_time: originalEventTime
    },
    user_data: {}
  } as const

  assert.throws(() =>
    mapMetaAppendAttributionEventToServerEvent({
      ...commonAppEvent,
      app_data: {
        application_tracking_enabled: true,
        extinfo: iosExtinfo
      }
    } as MetaAppendAttributionEvent)
  )

  assert.throws(() =>
    mapMetaAppendAttributionEventToServerEvent({
      ...commonAppEvent,
      app_data: {
        application_tracking_enabled: true,
        extinfo: androidExtinfo
      }
    } as MetaAppendAttributionEvent)
  )
})

test('calculates stable attribution values without binary float tails', () => {
  assert.equal(calculateMetaAppendAttributionValue(0.1, 0.2), 0.02)
})
