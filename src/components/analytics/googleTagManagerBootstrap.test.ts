import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { GOOGLE_TAG_MANAGER_BOOTSTRAP } from './googleTagManagerBootstrap'

type BootstrapWindow = {
  dataLayer: unknown[]
  gtag?: (...args: unknown[]) => void
  location: { href: string }
}

function runBootstrap() {
  const browserWindow: BootstrapWindow = {
    dataLayer: [],
    location: {
      href: 'https://utekos.no/skreddersy-varmen?fbclid=meta-click&ScCid=snap-click&utm_source=facebook#bestill'
    }
  }

  vm.runInNewContext(GOOGLE_TAG_MANAGER_BOOTSTRAP, {
    Array,
    Boolean,
    Date,
    String,
    URL,
    window: browserWindow
  })

  return { browserWindow }
}

function commandArguments(browserWindow: BootstrapWindow) {
  const commands = browserWindow.dataLayer
    .filter(
      value =>
        !value ||
        typeof value !== 'object' ||
        !('event' in value)
    )
    .map(value => Array.from(value as ArrayLike<unknown>))

  return JSON.parse(JSON.stringify(commands)) as unknown[][]
}

test('defaults Consent Mode to the operator tracking policy before GTM starts', () => {
  const { browserWindow } = runBootstrap()
  const commands = commandArguments(browserWindow)

  assert.deepEqual(commands[0], [
    'consent',
    'default',
    {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    }
  ])
  assert.deepEqual(commands[1], [
    'set',
    'ads_data_redaction',
    false
  ])
  assert.equal(
    browserWindow.dataLayer.some(
      value =>
        value !== null &&
        typeof value === 'object' &&
        'event' in value &&
        value.event === 'gtm.js'
    ),
    false
  )
})

test('keeps the paid landing URL under the operator policy', () => {
  const { browserWindow } = runBootstrap()
  const commands = commandArguments(browserWindow)

  assert.deepEqual(commands[2], [
    'set',
    {
      page_location:
        'https://utekos.no/skreddersy-varmen?fbclid=meta-click&ScCid=snap-click&utm_source=facebook'
    }
  ])
})
