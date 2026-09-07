import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  new URL('./PageViewObserver.tsx', import.meta.url),
  'utf8'
)

test('landing consent registration precedes optional attribution and identity work', () => {
  const callback = source.slice(
    source.indexOf('const observeConsent =')
  )
  const record = callback.search(
    /browserLandingConsentTransport\s*\.observe/
  )
  assert.ok(record >= 0)
  assert.ok(
    record < callback.indexOf('resolveCampaignAttribution')
  )
  assert.ok(
    record <
      callback.indexOf(
        'browserFirstPartyExternalIdStore.getOrCreate'
      )
  )
})

test('deferred browser release rechecks authoritative consent and preserves the original event', () => {
  const release = source.slice(
    source.indexOf('window.setTimeout')
  )
  assert.match(
    release,
    /hasCookiebotDecision\(latestCookiebot\)/
  )
  assert.match(release, /latestConsent.marketing !== 'granted'/)
  assert.match(release, /event: pageView.event/)
  assert.match(release, /consent: latestConsent/)
})
