import assert from 'node:assert/strict'
import test from 'node:test'
import {
  discardRejectedMetaBrowserEvents,
  initializeSignalsGatewayPixel,
  prepareSignalsGatewayPixelQueue,
  type MetaBrowserWindow
} from './signalsGatewayPixelRuntime'

function createBrowserWindow(): MetaBrowserWindow {
  return {
    dataLayer: [{ event_id: 'first' }, { event_id: 'second' }]
  } as unknown as MetaBrowserWindow
}

test('queues only Signals Gateway setup commands and initializes once', () => {
  const browserWindow = createBrowserWindow()
  const config = {
    host: 'https://signals.utekos.no/',
    pixelId: '1633085772154426486'
  }

  prepareSignalsGatewayPixelQueue(browserWindow)
  prepareSignalsGatewayPixelQueue(browserWindow)
  initializeSignalsGatewayPixel(browserWindow, config)
  initializeSignalsGatewayPixel(browserWindow, config)

  assert.equal(browserWindow.cbq, browserWindow._cbq)
  assert.deepEqual(browserWindow.cbq?.queue, [
    ['setHost', 'https://signals.utekos.no/'],
    ['init', '1633085772154426486']
  ])
  assert.equal(
    browserWindow.cbq?.queue.some(command =>
      String(command[0]).startsWith('track')
    ),
    false
  )
  assert.deepEqual(
    browserWindow.__utekosSignalsGatewayPixelState,
    {
      host: 'https://signals.utekos.no/',
      initialized: true,
      mode: 'canonical_fbq_cbq_pair',
      pixelId: '1633085772154426486'
    }
  )
})

test('rejects a second Signals Gateway Pixel configuration', () => {
  const browserWindow = createBrowserWindow()

  prepareSignalsGatewayPixelQueue(browserWindow)
  initializeSignalsGatewayPixel(browserWindow, {
    host: 'https://signals.utekos.no/',
    pixelId: '1633085772154426486'
  })

  assert.throws(
    () =>
      initializeSignalsGatewayPixel(browserWindow, {
        host: 'https://other.example/',
        pixelId: 'different'
      }),
    /different configuration/
  )
})

test('marks every pre-rejection canonical row as consumed', () => {
  const browserWindow = createBrowserWindow()

  discardRejectedMetaBrowserEvents(browserWindow)

  assert.deepEqual(browserWindow.__utekosMetaPixelState, {
    initialized: false,
    lastDataLayerIndex: 2,
    listening: false,
    poller: null,
    sent: {},
    timer: null
  })

  browserWindow.dataLayer?.push({ event_id: 'third' })
  discardRejectedMetaBrowserEvents(browserWindow)

  assert.equal(
    browserWindow.__utekosMetaPixelState?.lastDataLayerIndex,
    3
  )
})
