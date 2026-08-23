type SnapchatCatalogProductMetadata = {
  googleProductCategory: string
  material: string
  productType: string
}

const SNAPCHAT_CATALOG_PRODUCT_METADATA: Record<
  string,
  SnapchatCatalogProductMetadata
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

export function getSnapchatCatalogProductMetadata(
  productHandle: string
) {
  const metadata =
    SNAPCHAT_CATALOG_PRODUCT_METADATA[productHandle]

  if (!metadata) {
    throw new Error(
      `Snapchat catalog product ${productHandle} is missing curated metadata`
    )
  }

  return metadata
}
