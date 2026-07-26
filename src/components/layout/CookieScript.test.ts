import assert from 'node:assert/strict'
import test from 'node:test'
import { CONSENT_MODE_DEFAULTS } from './CookieScript'

test('defaults consent to denied and bridges the legacy GTM Cookiebot tag', () => {
  assert.match(CONSENT_MODE_DEFAULTS, /ad_storage: 'denied'/)
  assert.match(CONSENT_MODE_DEFAULTS, /analytics_storage: 'denied'/)
  assert.match(CONSENT_MODE_DEFAULTS, /ad_user_data: 'denied'/)
  assert.match(CONSENT_MODE_DEFAULTS, /ad_personalization: 'denied'/)
  assert.match(CONSENT_MODE_DEFAULTS, /'gtm\.blocklist': \['sandboxedScripts'\]/)
  assert.match(CONSENT_MODE_DEFAULTS, /'gtm\.blocklist': \[\]/)
  assert.match(CONSENT_MODE_DEFAULTS, /CookiebotCallback_OnLoad/)
  assert.match(CONSENT_MODE_DEFAULTS, /Cookiebot\.renew\(\)/)
  assert.match(CONSENT_MODE_DEFAULTS, /!window\.Cookiebot\.hasResponse/)
  assert.match(CONSENT_MODE_DEFAULTS, /event: 'cookie_consent_update'/)
})
