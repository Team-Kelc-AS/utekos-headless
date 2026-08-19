import assert from 'node:assert/strict'
import test from 'node:test'
import { sha256Hex } from './sha256Hex'

test('matches SHA-256 UTF-8 digests from the encoding toolkit', async () => {
  assert.equal(
    await sha256Hex(''),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  )
  assert.equal(
    await sha256Hex(
      'gid://shopify/Cart/abc|gid://shopify/ProductVariant/123|1|2026-08-19T10:00:00.000Z'
    ),
    '986c013c665a9d58091ea50f1a58d03a5d0de15b176b40ed116a322616e8cc02'
  )
  assert.equal(
    await sha256Hex(
      'gid://shopify/Cart/abc|gid://shopify/ProductVariant/123|1|2026-08-19T10:00:00.000Zæøå'
    ),
    'dc7c1d40c7ebbb338864f71f2fbad26c575188a67c112cccbd8131eb9a1056ab'
  )
})
