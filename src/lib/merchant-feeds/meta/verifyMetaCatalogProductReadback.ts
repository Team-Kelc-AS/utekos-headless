import type { MetaCatalogOffer } from './metaCatalogOffer'
import type { MetaCatalogProductReadback } from './metaCatalogProductReadbackSchema'

export function verifyMetaCatalogProductReadback(input: {
  deleteOfferIds: readonly string[]
  offers: readonly MetaCatalogOffer[]
  products: readonly MetaCatalogProductReadback[]
}) {
  const expected = new Map(
    input.offers.map(offer => [offer.id, offer])
  )
  const actual = new Map(
    input.products.map(product => [product.retailer_id, product])
  )
  const failures: string[] = []

  for (const [id, offer] of expected) {
    const product = actual.get(id)

    if (!product) {
      failures.push(`${id}: missing from Meta`)
      continue
    }

    const fields = {
      name: [product.name, offer.title],
      category: [product.category, offer.googleProductCategory],
      fb_product_category: [
        product.fb_product_category,
        offer.facebookProductCategory
      ],
      gtin: [product.gtin, offer.gtin],
      manufacturer_part_number: [
        product.manufacturer_part_number,
        offer.mpn
      ],
      availability: [product.availability, offer.availability],
      visibility: [product.visibility, offer.visibility],
      url: [product.url, offer.link]
    } as const

    for (const [field, [received, wanted]] of Object.entries(
      fields
    )) {
      if (received !== wanted) {
        failures.push(`${id}.${field}: readback mismatch`)
      }
    }
  }

  for (const id of actual.keys()) {
    if (!expected.has(id)) failures.push(`${id}: unexpected in Meta`)
  }

  for (const id of input.deleteOfferIds) {
    if (actual.has(id)) failures.push(`${id}: deleted item still present`)
  }

  if (failures.length > 0) {
    throw new Error(
      `Meta catalog readback verification failed: ${failures.join('; ')}`
    )
  }

  return {
    catalogProductCount: input.products.length,
    expectedProductCount: input.offers.length,
    missingGoogleProductCategoryCount: input.products.filter(
      product => !product.category
    ).length,
    missingFacebookProductCategoryCount: input.products.filter(
      product => !product.fb_product_category
    ).length,
    missingGtinCount: input.products.filter(product => !product.gtin)
      .length,
    missingMpnCount: input.products.filter(
      product => !product.manufacturer_part_number
    ).length,
    nonPublicUrlCount: input.products.filter(
      product => !product.url?.startsWith('https://utekos.no/')
    ).length,
    deletedProductCount: input.deleteOfferIds.filter(id =>
      actual.has(id)
    ).length,
    categories: [
      ...new Set(
        input.products.flatMap(product =>
          product.category ? [product.category] : []
        )
      )
    ].sort()
  }
}
