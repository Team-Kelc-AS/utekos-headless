import assert from 'node:assert/strict'
import Module, { createRequire } from 'node:module'
import test from 'node:test'
import { canonicalPageViewSchema } from './pageViewEvent'

const loader = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const original = loader._load
let gtmCalls = 0
let recorded = 0
loader._load = (request, parent, isMain) => {
  if (/sendCanonicalGTMEvent(?:\.ts)?$/.test(request))
    return {
      sendCanonicalGTMEvent: () => {
        gtmCalls++
      }
    }
  if (/browserMetaAudience(?:\.ts)?$/.test(request))
    return {
      enrichBrowserMetaAudience: (event: unknown) => event
    }
  if (/pageViewSession(?:\.ts)?$/.test(request))
    return {
      browserPageViewSession: {
        recordEmitted: () => {
          recorded++
        }
      }
    }
  return original.call(Module, request, parent, isMain)
}
const require = createRequire(import.meta.url)
const { emitCanonicalPageView } =
  require('./emitCanonicalPageView.ts') as typeof import('./emitCanonicalPageView')
loader._load = original

test('Meta-only page view is buffered before the transport loads and never invokes GTM', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(
    globalThis,
    'window'
  )
  const browser: { dataLayer?: Array<Record<string, unknown>> } =
    {}
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: browser
  })
  try {
    const event = canonicalPageViewSchema.parse({
      schema_version: 1,
      event_name: 'page_view',
      event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd',
      event_time: '2026-09-25T10:00:00.000Z',
      source: 'web',
      environment: 'test',
      page_url: 'https://utekos.no/dun-venteliste',
      page_title: 'Utekos Dun',
      consent: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      }
    })
    emitCanonicalPageView(event, true)
    assert.equal(gtmCalls, 0)
    assert.equal(recorded, 1)
    assert.equal(browser.dataLayer?.length, 1)
    assert.equal(
      browser.dataLayer?.[0]?.event_id,
      event.event_id
    )
    emitCanonicalPageView(event)
    assert.equal(gtmCalls, 1)
  } finally {
    if (previousWindow)
      Object.defineProperty(globalThis, 'window', previousWindow)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
