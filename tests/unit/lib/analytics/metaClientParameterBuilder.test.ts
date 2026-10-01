import assert from 'node:assert/strict'
import test from 'node:test'
import { ensureMetaClientParameterContext } from '@/lib/analytics/metaClientParameterBuilder'
import { extractFbclidFromFbc } from '@/lib/analytics/extractFbclidFromFbc'

const consent = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'denied',
  source: 'cookiebot',
  version: '1'
} as const

test('Parameter Builder refreshes revisited landings and retries missing native click IDs', async t => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const originalSelf = Object.getOwnPropertyDescriptor(globalThis, 'self')
  const cookies = new Map<string, string>()
  let writes = 0
  let nativeClickId = ''
  const browser = {
    location: new URL('http://localhost/'),
    navigator: { userAgent: 'Test browser', vendor: '' },
    webkit: {
      messageHandlers: {
        browserProperties: {
          postMessage: async () => nativeClickId
        }
      }
    }
  }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser })
  Object.defineProperty(globalThis, 'self', { configurable: true, value: browser })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      referrer: '',
      get cookie() {
        return [...cookies].map(([key, value]) => `${key}=${value}`).join('; ')
      },
      set cookie(value: string) {
        writes++
        const pair = value.split(';')[0]!
        const separator = pair.indexOf('=')
        cookies.set(pair.slice(0, separator), pair.slice(separator + 1))
      }
    }
  })
  t.after(() => {
    for (const [key, descriptor] of [
      ['window', originalWindow],
      ['self', originalSelf],
      ['document', originalDocument]
    ] as const) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  })
  const collect = async (url: string) => {
    browser.location = new URL(url)
    return ensureMetaClientParameterContext({ consent, pageUrl: url })
  }

  await t.test('A to B to A restores the genuine click on the revisited landing', async () => {
    const first = await collect('http://localhost/?fbclid=ClickCaseA')
    assert.equal(extractFbclidFromFbc(first.fbc), 'ClickCaseA')
    const second = await collect('http://localhost/?fbclid=ClickCaseB')
    assert.equal(extractFbclidFromFbc(second.fbc), 'ClickCaseB')
    const revisited = await collect('http://localhost/?fbclid=ClickCaseA')
    assert.equal(extractFbclidFromFbc(revisited.fbc), 'ClickCaseA')
  })

  await t.test('a complete same-page context is reused without extra cookie writes', async () => {
    const before = writes
    const context = await collect('http://localhost/?fbclid=ClickCaseA')
    assert.equal(extractFbclidFromFbc(context.fbc), 'ClickCaseA')
    assert.equal(writes, before)
  })

  await t.test('a removed cookie is collected again on the same URL', async () => {
    cookies.delete('_fbc')
    const context = await collect('http://localhost/?fbclid=ClickCaseA')
    assert.equal(extractFbclidFromFbc(context.fbc), 'ClickCaseA')
  })

  await t.test('an initially unavailable native backup click can be recovered later', async () => {
    cookies.delete('_fbc')
    const url = 'http://localhost/native-landing'
    assert.equal((await collect(url)).fbc, undefined)
    nativeClickId = 'NativeClickCaseSensitive'
    const context = await collect(url)
    assert.equal(extractFbclidFromFbc(context.fbc), nativeClickId)
  })

  await t.test('denied marketing collection cannot write or expose identifiers', async () => {
    const before = writes
    assert.deepEqual(await ensureMetaClientParameterContext({
      consent: { ...consent, marketing: 'denied' },
      pageUrl: browser.location.href
    }), {})
    assert.equal(writes, before)
  })
})
