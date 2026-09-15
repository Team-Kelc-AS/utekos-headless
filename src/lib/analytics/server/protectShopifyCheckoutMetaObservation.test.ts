import assert from 'node:assert/strict'
import test from 'node:test'

import { protectShopifyCheckoutMetaObservation } from './protectShopifyCheckoutMetaObservation'

test('replaces raw Shopify checkout identity with Meta-compatible hashes', () => {
  const protectedObservation =
    protectShopifyCheckoutMetaObservation({
      contract: 'utekos.shopify.checkout_observation',
      schemaVersion: 3,
      source: 'shopify_app_web_pixel',
      verificationStatus: 'observed',
      eventId: 'shipping-1',
      eventName: 'checkout_shipping_info_submitted',
      eventSequence: 4,
      occurredAt: '2026-09-15T12:00:00.000Z',
      checkoutToken: 'checkout-token',
      correlation: {
        beginCheckoutEventId:
          '71c2ef59-6e6f-4f56-a63a-567ca398f9de'
      },
      commerce: {
        currencyCode: 'NOK',
        value: 2490,
        itemQuantity: 1
      },
      customer: {
        email: 'Kari@example.no',
        phone: '+47 999 99 999',
        firstName: 'Kari',
        lastName: 'Nordmann',
        city: 'Oslo',
        provinceCode: 'NO-03',
        postalCode: '0001',
        countryCode: 'NO'
      },
      privacy: {
        analyticsProcessingAllowed: true,
        marketingAllowed: true,
        preferencesProcessingAllowed: false,
        saleOfDataAllowed: true
      }
    })

  const serialized = JSON.stringify(protectedObservation)
  assert.doesNotMatch(
    serialized,
    /Kari|Nordmann|example[.]no|999 99 999|Oslo/u
  )
  assert.equal(
    protectedObservation.customerMatch.email_sha256?.[0]?.length,
    64
  )
  assert.equal(
    protectedObservation.customerMatch.phone_sha256?.[0]?.length,
    64
  )
  assert.equal(
    protectedObservation.customerMatch.first_name_sha256?.[0]
      ?.length,
    64
  )
})
