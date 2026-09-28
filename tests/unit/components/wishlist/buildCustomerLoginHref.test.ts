import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCustomerLoginHref } from '@/components/wishlist/buildCustomerLoginHref'

test('builds an encoded login URL with mode and return path', () => {
  assert.equal(
    buildCustomerLoginHref({
      mode: 'create',
      returnTo:
        '/produkter/utekos-dun?variant=gid://shopify/ProductVariant/1'
    }),
    '/customer/account/login?mode=create&returnTo=%2Fprodukter%2Futekos-dun%3Fvariant%3Dgid%3A%2F%2Fshopify%2FProductVariant%2F1'
  )
})
