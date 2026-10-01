import assert from 'node:assert/strict'
import test from 'node:test'
import { buildProductModel } from '@/lib/products/commerce/buildProductModel'
import { buildProductGroupJsonLd } from '@/lib/products/structured-data/buildProductGroupJsonLd'
import { createTechDownShopifyProductFixture } from '@/lib/products/testing/createTechDownShopifyProductFixture'

test('builds a purchasable Svale model and structured data without unsupported facts', () => {
  const raw = createTechDownShopifyProductFixture()
  raw.handle = 'utekos-svale'
  raw.variants.edges = raw.variants.edges
    .slice(1)
    .map(({ node }) => ({
      node: {
        ...node,
        selectedOptions: node.selectedOptions
          .filter(option => option.name === 'Størrelse')
          .map(option => ({ ...option, name: 'Size' }))
      }
    }))
  raw.options = [
    {
      name: 'Size',
      optionValues: [
        { name: 'Middels' },
        { name: 'Stor' },
        { name: 'Større' }
      ]
    }
  ]
  const model = buildProductModel(raw)
  assert.equal(model.title, 'Utekos Svale')
  assert.deepEqual(
    model.variants.map(variant => variant.options.size),
    ['Middels', 'Stor', 'Større']
  )
  assert.equal(
    model.defaultVariantId,
    raw.variants.edges[1]!.node.id
  )
  assert.equal(
    model.variants[0]!.price.amount,
    raw.variants.edges[0]!.node.price.amount
  )
  assert.equal(model.material, undefined)
  assert.equal(model.audience, undefined)
  const jsonLd = buildProductGroupJsonLd(model)
  assert.equal('material' in jsonLd, false)
  assert.equal('audience' in jsonLd, false)
  assert.ok(
    jsonLd.hasVariant.every(variant => !('audience' in variant))
  )
})
