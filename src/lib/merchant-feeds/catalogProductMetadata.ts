export type CatalogProductMetadata = {
  facebookProductCategory: string
  googleProductCategory: string
  material: string
  productType: string
}

const CATALOG_PRODUCT_METADATA: Record<
  string,
  CatalogProductMetadata
> = {
  comfyrobe: {
    facebookProductCategory: '528',
    googleProductCategory: '5598',
    material: 'HydroGuard™-skall og SherpaCore™-fôr',
    productType:
      'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets'
  },
  'utekos-dun': {
    facebookProductCategory: '528',
    googleProductCategory: '203',
    material: 'Nylon og dunfyll',
    productType:
      'Apparel & Accessories > Clothing > Outerwear'
  },
  'utekos-mikrofiber': {
    facebookProductCategory: '528',
    googleProductCategory: '203',
    material: 'Nylon og mikrofiberfyll',
    productType:
      'Apparel & Accessories > Clothing > Outerwear'
  },
  'utekos-stapper': {
    facebookProductCategory: '2601',
    googleProductCategory: '5636',
    material: 'Slitesterkt kompresjonsstoff',
    productType:
      'Sporting Goods > Outdoor Recreation > Camping & Hiking > Compression Sacks'
  },
  'utekos-techdown': {
    facebookProductCategory: '528',
    googleProductCategory: '203',
    material: 'Nylon og TechDown™-isolasjon',
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
