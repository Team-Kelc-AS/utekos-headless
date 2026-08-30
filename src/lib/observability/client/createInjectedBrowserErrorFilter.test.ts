import assert from 'node:assert/strict'
import test from 'node:test'

import { createInjectedBrowserErrorFilter } from './createInjectedBrowserErrorFilter'

const autofillError = {
  message:
    'ReferenceError: Can\'t find variable: _AutofillCallbackHandler',
  source: '/skreddersy-varmen'
}

const htmlHydrationError = {
  message:
    'Error: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message',
  source: '/_next/static/immutable/chunks'
}

test('filters the observed injected autofill and immediate HTML hydration pair', () => {
  let now = 1_000
  const isInjectedBrowserNoise =
    createInjectedBrowserErrorFilter({ now: () => now })

  assert.equal(isInjectedBrowserNoise(autofillError), true)

  now += 500
  assert.equal(isInjectedBrowserNoise(htmlHydrationError), true)
})

test('keeps independent and text hydration failures actionable', () => {
  let now = 1_000
  const isInjectedBrowserNoise =
    createInjectedBrowserErrorFilter({ now: () => now })

  assert.equal(isInjectedBrowserNoise(htmlHydrationError), false)
  assert.equal(isInjectedBrowserNoise(autofillError), true)

  now += 500
  assert.equal(
    isInjectedBrowserNoise({
      ...htmlHydrationError,
      message: htmlHydrationError.message.replace(
        'args[]=HTML',
        'args[]=text'
      )
    }),
    false
  )

  now += 2_001
  assert.equal(isInjectedBrowserNoise(htmlHydrationError), false)
})

test('does not suppress a first-party error after injected autofill noise', () => {
  let now = 1_000
  const isInjectedBrowserNoise =
    createInjectedBrowserErrorFilter({ now: () => now })

  assert.equal(isInjectedBrowserNoise(autofillError), true)
  now += 100
  assert.equal(
    isInjectedBrowserNoise({
      message: 'Checkout failed',
      source: '/_next/static/immutable/chunks'
    }),
    false
  )
})
