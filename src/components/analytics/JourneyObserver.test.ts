import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  new URL('./JourneyObserver.tsx', import.meta.url),
  'utf8'
)

test('reads environment in an effect event and refires only for a new visit', () => {
  const eventStart = source.indexOf('useEffectEvent')
  const effectStart = source.indexOf('useEffect(')
  assert.ok(eventStart >= 0)
  assert.ok(effectStart > eventStart)
  const eventBody = source.slice(eventStart, effectStart)
  assert.match(eventBody, /=> environment/)
  assert.match(
    source,
    /readVisitEnvironment\(\s*pathname,\s*search\s*\)/
  )
  assert.match(source, /\}, \[pathname, search\]\)/)
  assert.doesNotMatch(
    source,
    /\[environment, pathname, search\]/
  )
})

test('keeps the popstate listener mounted across route cleanup', () => {
  const popstateStart = source.search(
    /addEventListener\('popstate'/
  )
  assert.ok(popstateStart >= 0)
  const popstateEffect = source.slice(
    source.lastIndexOf('useEffect(', popstateStart),
    source.indexOf('useEffect(', popstateStart + 1)
  )
  assert.match(popstateEffect, /\}, \[\]\)/)
})
