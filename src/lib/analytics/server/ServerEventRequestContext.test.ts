import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ServerEvent,
  UserData
} from 'facebook-nodejs-business-sdk'
import { buildMetaRequestContext } from './buildMetaRequestContext'
import { metaMarketingRequestContextPreference } from './metaMarketingRequestContextPreference'

const consent = {
  analytics: 'denied',
  marketing: 'granted',
  preferences: 'denied',
  source: 'cookiebot',
  version: '1'
} as const

test('native request context preserves canonical identifiers and adds the builder referrer', () => {
  const fbc = 'fb.1.1784368700000.meta-click.AQQCAQMB'
  const fbp = 'fb.1.1784368600000.123456789.AQQCAQMB'
  const clientIpAddress = '203.0.113.8'
  const event = {
    schema_version: 1,
    event_name: 'page_view',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_time: '2026-07-18T10:00:00.000Z',
    source: 'web',
    environment: 'test',
    consent,
    browser_id: { fbc, fbp },
    client_ip_address: clientIpAddress,
    page_url: 'https://utekos.no/kampanje?fbclid=meta-click',
    referrer_url: 'https://www.facebook.com/'
  } as const
  const serverEvent = new ServerEvent()

  serverEvent
    .setEventName('PageView')
    .setUserData(
      new UserData()
        .setFbc(fbc)
        .setFbp(fbp)
        .setClientIpAddress(clientIpAddress)
    )
    .setEventSourceUrl(event.page_url)
  serverEvent.setRequestContext(
    buildMetaRequestContext(event),
    metaMarketingRequestContextPreference
  )

  const payload = serverEvent.normalize() as {
    event_source_url: string
    referrer_url: string
    user_data: {
      client_ip_address: string
      fbc: string
      fbp: string
    }
  }

  assert.equal(payload.user_data.fbc, fbc)
  assert.equal(payload.user_data.fbp, fbp)
  assert.equal(
    payload.user_data.client_ip_address,
    clientIpAddress
  )
  assert.equal(payload.event_source_url, event.page_url)
  assert.match(
    payload.referrer_url,
    /^https:\/\/www\.facebook\.com\/\.[A-Za-z0-9]{8}$/
  )
})

test('native request context enriches request metadata without minting late browser ids', () => {
  const event = {
    schema_version: 1,
    event_name: 'page_view',
    event_id: 'd9dd30a0-a209-474b-88c2-372f06cebf54',
    event_time: '2026-07-18T10:00:00.000Z',
    source: 'web',
    environment: 'test',
    consent,
    click_id: { fbclid: 'server-query-click' },
    client_ip_address: '8.8.8.8',
    page_url: 'https://utekos.no/produkter'
  } as const
  const serverEvent = new ServerEvent()

  serverEvent.setRequestContext(
    buildMetaRequestContext(event),
    metaMarketingRequestContextPreference
  )

  const payload = serverEvent.normalize() as {
    event_source_url?: string
    opt_out?: boolean
    referrer_url?: string
    user_data: {
      client_ip_address?: string
      external_id?: string
      fbc?: string
      fbp?: string
      em?: string
      country?: string
      ct?: string
      st?: string
      zp?: string
    }
  }

  assert.equal(payload.user_data.external_id, undefined)
  assert.equal(payload.referrer_url, undefined)
  assert.match(
    payload.event_source_url ?? '',
    /^https:\/\/utekos\.no\/produkter\.[A-Za-z0-9]{8}$/
  )
  assert.match(
    payload.user_data.client_ip_address ?? '',
    /^8\.8\.8\.8\.[A-Za-z0-9]{8}$/
  )
  assert.equal(payload.user_data.fbc, undefined)
  assert.equal(payload.user_data.fbp, undefined)
  assert.equal(payload.user_data.em, undefined)
  assert.equal(payload.opt_out, undefined)
  assert.equal(payload.user_data.country, undefined)
  assert.equal(payload.user_data.ct, undefined)
  assert.equal(payload.user_data.st, undefined)
  assert.equal(payload.user_data.zp, undefined)
})
