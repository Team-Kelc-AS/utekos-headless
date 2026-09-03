import assert from 'node:assert/strict'
import test from 'node:test'
import {
  discardRejectedMetaBrowserEvents,
  type MetaBrowserWindow
} from './metaBrowserTransportRuntime'

function createBrowserWindow(): MetaBrowserWindow {
  return {
    dataLayer: [{ event_id: 'first' }, { event_id: 'second' }]
  } as unknown as MetaBrowserWindow
}

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
