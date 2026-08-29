import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildShopifyFilesCdnUrl,
  SHOPIFY_FILES_CDN_ORIGIN
} from './buildShopifyFilesCdnUrl'

test('builds a Shopify Files CDN URL without query or hash', () => {
  const url = buildShopifyFilesCdnUrl('TechDown-Havdyp-Master.png')

  assert.equal(
    url,
    `${SHOPIFY_FILES_CDN_ORIGIN}/TechDown-Havdyp-Master.png`
  )
  assert.doesNotMatch(url, /[?#]/)
})

test('rejects file names that would introduce a query or path', () => {
  assert.throws(
    () =>
      buildShopifyFilesCdnUrl(
        'TechDown-Havdyp-Master.png?v=1787981259'
      ),
    /bare file name without query/
  )
  assert.throws(
    () => buildShopifyFilesCdnUrl('nested/TechDown-Havdyp-Master.png'),
    /bare file name without query/
  )
})
