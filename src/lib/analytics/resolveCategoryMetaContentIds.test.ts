import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveCategoryMetaContentIds } from './resolveCategoryMetaContentIds'

test('takes unique numeric variant ids from the first available variants', () => {
  assert.deepEqual(
    resolveCategoryMetaContentIds(
      [
        {
          selectedOrFirstAvailableVariant: {
            id: 'gid://shopify/ProductVariant/111'
          }
        },
        {
          selectedOrFirstAvailableVariant: {
            id: 'gid://shopify/ProductVariant/111'
          }
        },
        {
          selectedOrFirstAvailableVariant: {
            id: 'gid://shopify/ProductVariant/222'
          }
        },
        { selectedOrFirstAvailableVariant: { id: 'not-numeric' } },
        {}
      ],
      10
    ),
    ['111', '222']
  )
})

test('caps content ids at the Meta ViewCategory window', () => {
  const products = Array.from({ length: 12 }, (_, index) => ({
    selectedOrFirstAvailableVariant: {
      id: `gid://shopify/ProductVariant/${index + 1}`
    }
  }))

  assert.equal(resolveCategoryMetaContentIds(products).length, 10)
})
