import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getKlarnaBasicAuthHeader,
  getKlarnaServerConfig
} from '@/lib/klarna/config'

test('uses the live EU API and Vercel API-key aliases in production', () => {
  const config = getKlarnaServerConfig({
    NEXT_PUBLIC_KLARNA_ENVIRONMENT: 'production',
    KLARNA_API_KEY_USERNAME: 'merchant-user',
    KLARNA_API_KEY_PASSWORD: 'merchant-password'
  })

  assert.deepEqual(config, {
    KLARNA_API_BASE_URL: 'https://api.klarna.com',
    KLARNA_API_USERNAME: 'merchant-user',
    KLARNA_API_PASSWORD: 'merchant-password'
  })
})

test('defaults legacy local credentials to the playground API', () => {
  const config = getKlarnaServerConfig({
    KLARNA_SHOPIFY_API_USERNAME: 'playground-user',
    KLARNA_API_KEY: 'playground-password'
  })

  assert.equal(
    config.KLARNA_API_BASE_URL,
    'https://api.playground.klarna.com'
  )
})

test('keeps an explicit regional base URL and removes trailing slashes', () => {
  const config = getKlarnaServerConfig({
    NEXT_PUBLIC_KLARNA_ENVIRONMENT: 'production',
    KLARNA_API_BASE_URL: 'https://api-na.klarna.com///',
    KLARNA_API_USERNAME: 'merchant-user',
    KLARNA_API_PASSWORD: 'merchant-password'
  })

  assert.equal(
    config.KLARNA_API_BASE_URL,
    'https://api-na.klarna.com'
  )
})

test('rejects an unknown Klarna environment', () => {
  assert.throws(
    () => getKlarnaServerConfig({
      NEXT_PUBLIC_KLARNA_ENVIRONMENT: 'staging',
      KLARNA_API_USERNAME: 'merchant-user',
      KLARNA_API_PASSWORD: 'merchant-password'
    }),
    /production or playground/
  )
})

test('builds the documented Basic authorization value', () => {
  const header = getKlarnaBasicAuthHeader({
    KLARNA_API_BASE_URL: 'https://api.klarna.com',
    KLARNA_API_USERNAME: 'merchant-user',
    KLARNA_API_PASSWORD: 'merchant-password'
  })

  assert.equal(
    header,
    `Basic ${Buffer.from('merchant-user:merchant-password').toString('base64')}`
  )
})
