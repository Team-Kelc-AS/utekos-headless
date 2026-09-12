import assert from 'node:assert/strict'
import test from 'node:test'
import {
  hasStoredCookiebotDecision,
  readCookiebotConsentCookie
} from './hasStoredCookiebotDecision'

test('treats a Cookiebot stamp cookie as a stored decision', () => {
  const stored =
    '{stamp:abc,necessary:true,preferences:false,statistics:false,marketing:false,method:explicit}'

  assert.equal(hasStoredCookiebotDecision(stored), true)
  assert.equal(
    hasStoredCookiebotDecision(encodeURIComponent(stored)),
    true
  )
})

test('does not treat a missing or malformed cookie as a decision', () => {
  assert.equal(hasStoredCookiebotDecision(undefined), false)
  assert.equal(hasStoredCookiebotDecision(''), false)
  assert.equal(hasStoredCookiebotDecision('statistics:true'), false)
  assert.equal(hasStoredCookiebotDecision('%E0%A4%A'), false)
  assert.equal(
    hasStoredCookiebotDecision('x'.repeat(4097)),
    false
  )
})

test('reads the CookieConsent cookie from a document cookie string', () => {
  assert.equal(
    readCookiebotConsentCookie(
      'other=1; CookieConsent={stamp:abc}; theme=dark'
    ),
    '{stamp:abc}'
  )
  assert.equal(readCookiebotConsentCookie('theme=dark'), undefined)
})
