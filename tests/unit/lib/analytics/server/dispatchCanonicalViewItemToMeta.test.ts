import assert from 'node:assert/strict'
import test from 'node:test'
import { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalViewItem } from '@/lib/analytics/viewItemEvent'
import {
  dispatchCanonicalViewItemToMeta,
  type MetaViewItemDispatchDependencies
} from '@/lib/analytics/server/dispatchCanonicalViewItemToMeta'

function viewItem(): CanonicalViewItem {
  return {
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'granted',
      source: 'cookiebot',
      version: '1'
    },
    custom_data: {
      currency: 'NOK',
      gross_value: 1990,
      items: []
    },
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_name: 'view_item',
    event_time: '2026-07-16T10:00:00.000Z',
    page_url: 'https://utekos.no/produkter/utekos-techdown'
  } as unknown as CanonicalViewItem
}

test('maps and sends one canonical view_item through the Meta adapter', async () => {
  const canonicalEvent = viewItem()
  const metaEvent = new ServerEvent().setEventName('ViewContent')
  const config = {
    accessToken: 'access-token',
    pixelId: '123456789'
  }
  let mappedInput: CanonicalViewItem | undefined
  let sentInput:
    | { config: typeof config; event: ServerEvent }
    | undefined

  const dependencies: MetaViewItemDispatchDependencies = {
    mapEvent: event => {
      mappedInput = event
      return metaEvent
    },
    readConfig: () => config,
    sendEvent: async (event, currentConfig) => {
      sentInput = { config: currentConfig, event }

      return {
        eventsReceived: 1,
        fbTraceId: 'meta-trace-1',
        messages: [],
        processedEntries: 1
      }
    }
  }

  const receipt = await dispatchCanonicalViewItemToMeta(
    canonicalEvent,
    dependencies
  )

  assert.equal(mappedInput, canonicalEvent)
  assert.deepEqual(sentInput, { config, event: metaEvent })
  assert.deepEqual(receipt, {
    eventId: canonicalEvent.event_id,
    eventName: 'view_item',
    provider: 'meta',
    result: {
      eventsReceived: 1,
      fbTraceId: 'meta-trace-1',
      messages: [],
      processedEntries: 1
    }
  })
})

test('does not read credentials or send when mapping fails', async () => {
  let readConfigCalled = false
  let sendCalled = false

  await assert.rejects(
    dispatchCanonicalViewItemToMeta(viewItem(), {
      mapEvent: () => {
        throw new Error('marketing consent granted')
      },
      readConfig: () => {
        readConfigCalled = true
        return {
          accessToken: 'access-token',
          pixelId: '123456789'
        }
      },
      sendEvent: async () => {
        sendCalled = true
        return { eventsReceived: 1, messages: [] }
      }
    }),
    /marketing consent granted/
  )

  assert.equal(readConfigCalled, false)
  assert.equal(sendCalled, false)
})
