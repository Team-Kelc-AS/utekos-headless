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
test('reads environment in an effect event and refires only for a new visit', () => {
  const eventStart = source.indexOf('useEffectEvent')
  const effectStart = source.indexOf('useEffect(')
  assert.ok(eventStart >= 0)
  assert.ok(effectStart > eventStart)
  const eventBody = source.slice(eventStart, effectStart)
  assert.match(eventBody, /environment/)
  assert.match(source, /emitPageView\(pathname, search\)/)
  assert.match(source, /\}, \[pathname, search\]\)/)
  assert.doesNotMatch(
    source,
    /\[environment, pathname, search\]/
  )
})

test('does not synchronously read viewport geometry for the initial page view', () => {
  assert.match(
    source,
    /readBrowserReporterContext\(undefined, \{\s*includeViewport: false\s*\}\)/
  )
})
