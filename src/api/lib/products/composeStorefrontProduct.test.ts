import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  StorefrontProductShell,
  StorefrontProductVariantPresentation
} from '@/api/shopify/types/storefrontApi'
import { composeStorefrontProduct } from './composeStorefrontProduct'

const productId = 'gid://shopify/Product/1'

const shell = {
  id: productId,
  title: 'Utekos Comfyrobe'
} as StorefrontProductShell

const variantPresentation = {
  id: productId,
  options: [],
  variants: { edges: [] }
} satisfies StorefrontProductVariantPresentation

test('composes matching shell and presentation graphs', () => {
  const product = composeStorefrontProduct(shell, variantPresentation)

  assert.equal(product?.id, productId)
  assert.equal(product?.title, 'Utekos Comfyrobe')
  assert.deepEqual(product?.variants, { edges: [] })
})

test('returns null only when both product graphs are absent', () => {
  assert.equal(composeStorefrontProduct(null, null), null)
})

test('rejects a partial product graph', () => {
  assert.throws(
    () => composeStorefrontProduct(shell, null),
    /incomplete product graph/
  )
})

test('rejects mismatched product graph identities', () => {
  assert.throws(
    () =>
      composeStorefrontProduct(shell, {
        ...variantPresentation,
        id: 'gid://shopify/Product/2'
      }),
    /mismatched product graphs/
  )
})
