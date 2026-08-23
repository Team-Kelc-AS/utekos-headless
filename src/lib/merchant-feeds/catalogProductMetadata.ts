export type CatalogProductMetadata = {
  googleProductCategory: string
  material: string
  productType: string
}

const CATALOG_PRODUCT_METADATA: Record<
  string,
  CatalogProductMetadata
> = {
  comfyrobe: {
    googleProductCategory: '187',
    material: 'Sherpa',
    productType:
      'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets'
  },
  'utekos-dun': {
    googleProductCategory: '203',
    material: 'Down',
    productType:
      'Apparel & Accessories > Clothing > Outerwear'
  },
  'utekos-mikrofiber': {
    googleProductCategory: '203',
    material: 'Nylon',
    productType:
      'Apparel & Accessories > Clothing > Outerwear'
  },
  'utekos-stapper': {
    googleProductCategory: '1013',
    material: 'Nylon',
    productType:
      'Sporting Goods > Outdoor Recreation > Camping & Hiking'
  },
  'utekos-techdown': {
    googleProductCategory: '203',
    material: 'Nylon',
    productType:
      'Apparel & Accessories > Clothing > Outerwear'
  }
}

export function getCatalogProductMetadata(
  productHandle: string
) {
  const metadata = CATALOG_PRODUCT_METADATA[productHandle]

  if (!metadata) {
    throw new Error(
      `Catalog product ${productHandle} is missing curated metadata`
    )
  }

  return metadata
}
