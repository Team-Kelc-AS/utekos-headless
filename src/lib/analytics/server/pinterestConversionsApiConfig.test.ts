import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getPinterestConversionsApiConfig,
  isPinterestConversionsApiConfigured
} from './pinterestConversionsApiConfig'

test('does not treat Pinterest CAPI as configured without all required env', () => {
  const previousEnabled = process.env.PINTEREST_CONVERSIONS_API_ENABLED
  const previousToken = process.env.PINTEREST_CONVERSIONS_ACCESS_TOKEN
  const previousAccount = process.env.PINTEREST_AD_ACCOUNT_ID

  try {
    delete process.env.PINTEREST_CONVERSIONS_API_ENABLED
    delete process.env.PINTEREST_CONVERSIONS_ACCESS_TOKEN
    delete process.env.PINTEREST_AD_ACCOUNT_ID

    assert.equal(isPinterestConversionsApiConfigured(), false)
    assert.equal(getPinterestConversionsApiConfig().enabled, false)

    process.env.PINTEREST_CONVERSIONS_API_ENABLED = 'true'
    assert.equal(isPinterestConversionsApiConfigured(), false)

    process.env.PINTEREST_CONVERSIONS_ACCESS_TOKEN = 'test-token'
    process.env.PINTEREST_AD_ACCOUNT_ID = '123456789'
    assert.equal(isPinterestConversionsApiConfigured(), true)
  } finally {
    if (previousEnabled === undefined) {
      delete process.env.PINTEREST_CONVERSIONS_API_ENABLED
    } else {
      process.env.PINTEREST_CONVERSIONS_API_ENABLED = previousEnabled
    }
    if (previousToken === undefined) {
      delete process.env.PINTEREST_CONVERSIONS_ACCESS_TOKEN
    } else {
      process.env.PINTEREST_CONVERSIONS_ACCESS_TOKEN = previousToken
    }
    if (previousAccount === undefined) {
      delete process.env.PINTEREST_AD_ACCOUNT_ID
    } else {
      process.env.PINTEREST_AD_ACCOUNT_ID = previousAccount
    }
  }
})
