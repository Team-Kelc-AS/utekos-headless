export type ProductSizeGuideFamily =
  | 'comfyrobe'
  | 'techdown'
  | 'utekos'

export function resolveProductSizeGuideFamily(
  productHandle: string
): ProductSizeGuideFamily {
  if (productHandle === 'comfyrobe') {
    return 'comfyrobe'
  }

  if (productHandle === 'utekos-techdown') {
    return 'techdown'
  }

  return 'utekos'
}
