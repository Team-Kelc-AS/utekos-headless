import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const source = readFileSync(
  new URL('./PageViewObserver.tsx', import.meta.url),
  'utf8'
)
test('creates the event only after reading a permitted current-page context', () => {
  assert.ok(
    source.indexOf('if (!context)') <
      source.indexOf('const event = createCanonicalPageView')
  )
  assert.match(
    source,
    /eventTime: new Date\(\)\.toISOString\(\)/
  )
  assert.match(source, /pageUrl: context.pageUrl/)
  assert.doesNotMatch(
    source,
    /browserLandingConsentTransport|landingEdgeCorrelation|releaseCanonicalPageViewForConsent/
  )
})
test('revocation clears only consented page-view state and transport', () => {
  assert.match(source, /browserPageViewSession.clear\(\)/)
  assert.match(
    source,
    /browserPageViewCollectorTransport.clear\(\)/
  )
})
