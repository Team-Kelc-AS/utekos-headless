import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { GOOGLE_TAG_MANAGER_BOOTSTRAP } from './googleTagManagerBootstrap'

type CookiebotState = {
  consent: { marketing: boolean; statistics: boolean }
  hasResponse: boolean
}

type BootstrapWindow = {
  __utekosCookiebotConsentReady?: boolean
  Cookiebot?: CookiebotState
  addEventListener: (
    eventName: string,
    listener: () => void
  ) => void
  dataLayer: unknown[]
  gtag?: (...args: unknown[]) => void
  location: { href: string }
}

function runBootstrap() {
  const listeners = new Map<string, () => void>()
  const browserWindow: BootstrapWindow = {
    addEventListener(eventName, listener) {
      listeners.set(eventName, listener)
    },
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

  return { browserWindow, listeners }
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

test('defaults Consent Mode to denied before GTM starts', () => {
  const { browserWindow } = runBootstrap()
  const commands = commandArguments(browserWindow)

  assert.deepEqual(commands[0], [
    'consent',
    'default',
    {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    }
  ])
  assert.deepEqual(commands[1], [
    'set',
    'ads_data_redaction',
    true
  ])
})

test('removes the complete query before a consent decision', () => {
  const { browserWindow } = runBootstrap()
  const commands = commandArguments(browserWindow)

  assert.deepEqual(commands[2], [
    'set',
    { page_location: 'https://utekos.no/skreddersy-varmen' }
  ])
})

test('marks Cookiebot unresolved until an authoritative event arrives', () => {
  const { browserWindow, listeners } = runBootstrap()

  assert.equal(
    browserWindow.__utekosCookiebotConsentReady,
    false
  )

  listeners.get('CookiebotOnConsentReady')?.()

  assert.equal(browserWindow.__utekosCookiebotConsentReady, true)
})

test('keeps analytics attribution but removes click IDs without marketing consent', () => {
  const { browserWindow, listeners } = runBootstrap()
  browserWindow.Cookiebot = {
    consent: { marketing: false, statistics: true },
    hasResponse: true
  }

  listeners.get('CookiebotOnAccept')?.()

  const commands = commandArguments(browserWindow)
  assert.deepEqual(commands.at(-1), [
    'set',
    {
      page_location:
        'https://utekos.no/skreddersy-varmen?utm_source=facebook'
    }
  ])
})

test('restores the paid landing URL only after marketing consent', () => {
  const { browserWindow, listeners } = runBootstrap()
  browserWindow.Cookiebot = {
    consent: { marketing: true, statistics: true },
    hasResponse: true
  }

  listeners.get('CookiebotOnConsentReady')?.()

  const commands = commandArguments(browserWindow)
  assert.deepEqual(commands.at(-1), [
    'set',
    {
      page_location:
        'https://utekos.no/skreddersy-varmen?fbclid=meta-click&ScCid=snap-click&utm_source=facebook'
    }
  ])
})
