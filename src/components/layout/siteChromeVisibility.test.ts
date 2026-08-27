import assert from 'node:assert/strict'
import test from 'node:test'

import { shouldHideHeaderAndFooter } from './siteChromeVisibility'

test('hides the header and footer on the TechDown selection route', () => {
  assert.equal(
    shouldHideHeaderAndFooter('/utvalg/techdown'),
    true
  )
  assert.equal(
    shouldHideHeaderAndFooter('/utvalg/techdown/variant'),
    true
  )
})

test('keeps the header and footer on other routes', () => {
  assert.equal(shouldHideHeaderAndFooter('/utvalg'), false)
  assert.equal(
    shouldHideHeaderAndFooter('/utvalg/techdown-extra'),
    false
  )
  assert.equal(shouldHideHeaderAndFooter('/'), false)
  assert.equal(shouldHideHeaderAndFooter(null), false)
})
