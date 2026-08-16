const PINTEREST_GOOGLE_PRODUCT_CATEGORIES = {
  campingAndHiking: '1013',
  coatsAndJackets: '187',
  outerwear: '203'
} as const

const PINTEREST_GOOGLE_PRODUCT_CATEGORY_BY_HANDLE: Record<
  string,
  string
> = {
  'comfyrobe':
    PINTEREST_GOOGLE_PRODUCT_CATEGORIES.coatsAndJackets,
  'utekos-dun': PINTEREST_GOOGLE_PRODUCT_CATEGORIES.outerwear,
  'utekos-mikrofiber':
    PINTEREST_GOOGLE_PRODUCT_CATEGORIES.outerwear,
  'utekos-techdown':
    PINTEREST_GOOGLE_PRODUCT_CATEGORIES.outerwear,
  'utekos-stapper':
    PINTEREST_GOOGLE_PRODUCT_CATEGORIES.campingAndHiking
}

export function getPinterestGoogleProductCategory(
  productHandle: string
): string {
  const productCategory =
    PINTEREST_GOOGLE_PRODUCT_CATEGORY_BY_HANDLE[productHandle]

  if (!productCategory) {
    throw new Error(
      `Pinterest catalog product ${productHandle} is missing a Google product category mapping`
    )
  }

  return productCategory
}
