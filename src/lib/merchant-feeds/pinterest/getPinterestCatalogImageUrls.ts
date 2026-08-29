import { getPinterestCatalogImageSet } from './pinterestCatalogPublicImages'

export type PinterestCatalogImageUrls = {
  imageLink: string
  additionalImageLinks: readonly string[]
}

export function getPinterestCatalogImageUrls(
  productHandle: string
): PinterestCatalogImageUrls {
  return getPinterestCatalogImageSet(productHandle)
}
