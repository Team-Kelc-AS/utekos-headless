import assert from 'node:assert/strict'
import test from 'node:test'

import { protectShopifyCheckoutMetaObservation } from '@/lib/analytics/server/protectShopifyCheckoutMetaObservation'

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
  const metaParameterBuilderMatch =
    protectedObservation.metaParameterBuilderMatch
  assert.ok(metaParameterBuilderMatch)

  for (const [parameterBuilderField, sharedHashField] of [
    ['city', 'city_sha256'],
    ['country', 'country_sha256'],
    ['email', 'email_sha256'],
    ['first_name', 'first_name_sha256'],
    ['last_name', 'last_name_sha256'],
    ['phone', 'phone_sha256'],
    ['postal_code', 'postal_code_sha256'],
    ['state', 'state_sha256']
  ] as const) {
    const parameterBuilderValue: string | undefined =
      metaParameterBuilderMatch[parameterBuilderField]?.[0]
    const sharedHash: string | undefined =
      protectedObservation.customerMatch[sharedHashField]?.[0]

    assert.match(
      parameterBuilderValue ?? '',
      /^[a-f0-9]{64}\.[A-Za-z0-9_-]{8}$/u
    )
    assert.equal(sharedHash?.length, 64)
    assert.equal(
      parameterBuilderValue?.split('.', 1)[0],
      sharedHash
    )
  }
})
