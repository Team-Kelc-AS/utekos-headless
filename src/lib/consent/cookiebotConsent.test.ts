import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildShopifyTrackingConsent,
  hasCookiebotMarketingConsent,
  hasCookiebotStatisticsConsent,
  mapCookiebotConsentToShopify
} from './cookiebotConsent'

test('consent gates fail closed before Cookiebot has a response', () => {
  const cookiebot = {
    hasResponse: false,
    consent: { statistics: true, marketing: true, preferences: true }
  }

  assert.equal(hasCookiebotStatisticsConsent(cookiebot), false)
  assert.equal(hasCookiebotMarketingConsent(cookiebot), false)
  assert.equal(mapCookiebotConsentToShopify(cookiebot), null)
})

test('YouTube marketing gate follows the resolved Cookiebot choice', () => {
  assert.equal(
    hasCookiebotMarketingConsent({
      hasResponse: true,
      consent: { marketing: true }
    }),
    true
  )
  assert.equal(
    hasCookiebotMarketingConsent({
      hasResponse: true,
      consent: { marketing: false }
    }),
    false
  )
})

test('Shopify headless consent uses the verified storefront domains', () => {
  assert.deepEqual(
    buildShopifyTrackingConsent({
      consent: {
        analytics: true,
        marketing: false,
        preferences: true
      },
      storefrontAccessToken: 'public-storefront-token'
    }),
    {
      analytics: true,
      marketing: false,
      preferences: true,
      headlessStorefront: true,
      checkoutRootDomain: 'kasse.utekos.no',
      storefrontRootDomain: 'utekos.no',
      storefrontAccessToken: 'public-storefront-token'
    }
  )
})

test('Cookiebot categories map exactly to Shopify consent purposes', () => {
  const cookiebot = {
    hasResponse: true,
    consent: { statistics: true, marketing: false, preferences: true }
  }

  assert.equal(hasCookiebotStatisticsConsent(cookiebot), true)
  assert.deepEqual(mapCookiebotConsentToShopify(cookiebot), {
    analytics: true,
    marketing: false,
    preferences: true
  })
})

test('withdrawal maps every withdrawn category to false', () => {
  assert.deepEqual(
    mapCookiebotConsentToShopify({
      hasResponse: true,
      consent: {
        statistics: false,
        marketing: false,
        preferences: false
      }
    }),
    { analytics: false, marketing: false, preferences: false }
  )
})
