import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import {
  SHOPIFY_STOREFRONT_API_VERSION,
  shopifyConfig
} from './shopify.config'

const require = createRequire(import.meta.url)
const hydrogenReactPackage = require(
  '@shopify/hydrogen-react/package.json'
) as { version: string }

test('pins the Storefront API version to Hydrogen React', () => {
  assert.equal(SHOPIFY_STOREFRONT_API_VERSION, '2026-04')
  assert.equal(shopifyConfig.apiVersion, '2026-04')
  assert.equal(hydrogenReactPackage.version, '2026.4.3')
})
