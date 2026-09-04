import type { MetaCatalogOffer } from './metaCatalogOffer'
import type { MetaCatalogProductReadback } from './metaCatalogProductReadbackSchema'

function normalizeImageTags(tags: readonly string[]) {
  return [...new Set(tags)].sort()
}

function serializeImages(
  images: readonly { url: string; tags: readonly string[] }[]
) {
  return JSON.stringify(
    images.map(image => ({
      url: image.url,
      tags: normalizeImageTags(image.tags)
    }))
  )
}

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

    if (product.image_fetch_status !== 'FETCHED') {
      failures.push(
        `${id}.image_fetch_status: images not fetched`
      )
    }

    if (product.image_url !== offer.images[0]?.url) {
      failures.push(`${id}.image_url: readback mismatch`)
    }

    if (
      JSON.stringify(product.additional_image_urls) !==
      JSON.stringify(
        offer.images.slice(1).map(image => image.url)
      )
    ) {
      failures.push(
        `${id}.additional_image_urls: readback mismatch`
      )
    }

    if (
      serializeImages(product.images) !==
      serializeImages(offer.images)
    ) {
      failures.push(`${id}.images: URL or tag readback mismatch`)
    }
  }

  for (const id of actual.keys()) {
    if (!expected.has(id))
      failures.push(`${id}: unexpected in Meta`)
  }

  for (const id of input.deleteOfferIds) {
    if (actual.has(id))
      failures.push(`${id}: deleted item still present`)
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
    missingGtinCount: input.products.filter(
      product => !product.gtin
    ).length,
    missingMpnCount: input.products.filter(
      product => !product.manufacturer_part_number
    ).length,
    nonPublicUrlCount: input.products.filter(
      product => !product.url?.startsWith('https://utekos.no/')
    ).length,
    catalogImageCount: input.products.reduce(
      (count, product) => count + product.images.length,
      0
    ),
    missingImageTagCount: input.products.reduce(
      (count, product) =>
        count +
        product.images.filter(image => image.tags.length === 0)
          .length,
      0
    ),
    imageFetchFailureCount: input.products.filter(
      product => product.image_fetch_status !== 'FETCHED'
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
