import assert from 'node:assert/strict'
import test from 'node:test'
import { hasCookiebotStatisticsConsent } from './cookiebotStatisticsConsent'

test('accepts only an explicit Cookiebot statistics grant', () => {
  const granted =
    '{stamp:abc,necessary:true,preferences:false,statistics:true,marketing:false}'
  const denied =
    '{stamp:abc,necessary:true,preferences:false,statistics:false,marketing:true}'

  assert.equal(hasCookiebotStatisticsConsent(granted), true)
  assert.equal(
    hasCookiebotStatisticsConsent(encodeURIComponent(granted)),
    true
  )
  assert.equal(hasCookiebotStatisticsConsent(denied), false)
})

test('fails closed for missing, malformed, or oversized consent cookies', () => {
  assert.equal(hasCookiebotStatisticsConsent(undefined), false)
  assert.equal(
    hasCookiebotStatisticsConsent('statistics:true'),
    false
  )
  assert.equal(hasCookiebotStatisticsConsent('%E0%A4%A'), false)
  assert.equal(
    hasCookiebotStatisticsConsent('x'.repeat(4097)),
    false
  )
})
