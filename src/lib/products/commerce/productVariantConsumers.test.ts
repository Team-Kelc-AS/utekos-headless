import assert from 'node:assert/strict'
import Module, { createRequire } from 'node:module'
import test from 'node:test'
import { mapShopifyViewItem } from '@/lib/analytics/shopifyViewItemCommerce'
import { buildProductGroupJsonLd } from '../structured-data/buildProductGroupJsonLd'
import { createTechDownShopifyProductFixture } from '../testing/createTechDownShopifyProductFixture'
import type { ProductPurchaseVariant } from 'types/product/ProductPurchaseModel'

const loader = Module as typeof Module & {
  _load: (
    id: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = loader._load.bind(Module)
loader._load = (id, parent, isMain) =>
  id === 'server-only' ? {} : originalLoad(id, parent, isMain)
const require = createRequire(import.meta.url)
const { buildProductModel } =
  require('./buildProductModel') as typeof import('./buildProductModel')

for (const barcode of ['4006381333931', null]) {
  test(`preserves ${barcode ?? 'missing'} barcode in the same variant used for purchase`, () => {
    const product = createTechDownShopifyProductFixture()
    const source = product.variants.edges.find(({ node }) =>
      node.selectedOptions.some(
        option => option.value === 'Middels'
      )
    )!.node
    source.barcode = barcode
    source.price = { amount: '2190.00', currencyCode: 'NOK' }
    source.compareAtPrice = {
      amount: '2490.00',
      currencyCode: 'NOK'
    }
    source.availableForSale = false
    const model = buildProductModel(product)
    const variant = model.variants.find(
      candidate => candidate.id === source.id
    )!
    const purchaseVariant: ProductPurchaseVariant = variant
    assert.equal(purchaseVariant, variant)
    assert.equal(purchaseVariant.barcode, barcode)
    assert.equal(purchaseVariant.id, source.id)
    assert.equal(purchaseVariant.sku, source.sku)
    const event = mapShopifyViewItem({
      product: model,
      variant: purchaseVariant,
      quantity: 2
    })
    const jsonLd = buildProductGroupJsonLd(
      model
    ).hasVariant.find(node => node.sku === source.sku)!
    assert.equal(event.items[0].variant_id, source.id)
    assert.equal(event.items[0].gtin, barcode ?? undefined)
    assert.equal(event.items[0].gross_unit_price, 2190)
    assert.equal(event.gross_value, 4380)
    assert.equal(event.items[0].available_for_sale, false)
    assert.equal(jsonLd.offers.price, source.price.amount)
    assert.equal(
      jsonLd.offers.availability,
      'https://schema.org/OutOfStock'
    )
    assert.equal(
      jsonLd.offers.priceSpecification?.price,
      '2490.00'
    )
    assert.equal(
      'gtin13' in jsonLd ? jsonLd.gtin13 : undefined,
      barcode ?? undefined
    )
  })
}
