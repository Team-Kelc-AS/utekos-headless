import { MERCHANT_FEED_SITE_URL } from '@/lib/merchant-feeds/merchantFeedSiteUrl'

import {
  getPinterestCatalogImageSet,
  PINTEREST_CATALOG_PUBLIC_IMAGE_DIRECTORY
} from './pinterestCatalogPublicImages'

export type PinterestCatalogImageUrls = {
  imageLink: string
  additionalImageLinks: readonly string[]
}

function buildPublicImageUrl(fileName: string) {
  return `${MERCHANT_FEED_SITE_URL}${PINTEREST_CATALOG_PUBLIC_IMAGE_DIRECTORY}/${encodeURIComponent(fileName)}`
}

export function getPinterestCatalogImageUrls(
  productHandle: string
): PinterestCatalogImageUrls {
  const imageSet = getPinterestCatalogImageSet(productHandle)

  return {
    imageLink: buildPublicImageUrl(imageSet.imageFileName),
    additionalImageLinks: imageSet.additionalFileNames.map(
      buildPublicImageUrl
    )
  }
}
