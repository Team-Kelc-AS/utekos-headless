const PINTEREST_PRODUCT_TYPE_BY_HANDLE: Record<string, string> =
  {
    'comfyrobe':
      'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
    'utekos-dun': 'Apparel & Accessories > Clothing > Outerwear',
    'utekos-mikrofiber':
      'Apparel & Accessories > Clothing > Outerwear',
    'utekos-techdown':
      'Apparel & Accessories > Clothing > Outerwear',
    'utekos-stapper':
      'Sporting Goods > Outdoor Recreation > Camping & Hiking'
  }

export function getPinterestProductType(
  productHandle: string
): string {
  const productType =
    PINTEREST_PRODUCT_TYPE_BY_HANDLE[productHandle]

  if (!productType) {
    throw new Error(
      `Pinterest catalog product ${productHandle} is missing a product_type mapping`
    )
  }

  return productType
}
