import { MERCHANT_FEED_SITE_URL } from '@/lib/merchant-feeds/merchantFeedSiteUrl'

import { buildShopifyFilesCdnUrl } from './buildShopifyFilesCdnUrl'
import {
  PINTEREST_MAX_ADDITIONAL_IMAGES,
  pinterestCatalogImageSetSchema
} from './pinterestCatalogImageUrlSchema'

export { PINTEREST_MAX_ADDITIONAL_IMAGES }

export const PINTEREST_CATALOG_PUBLIC_IMAGE_DIRECTORY =
  '/Utekos-TechDown-Maritime-Blue-Unisex'

export type PinterestCatalogImageSet = {
  imageLink: string
  additionalImageLinks: readonly string[]
}

type PinterestCatalogImageOrigin = 'shopify-files' | 'first-party'

type PinterestCatalogImageSource = {
  origin: PinterestCatalogImageOrigin
  imageFileName: string
  additionalFileNames: readonly string[]
}

const PINTEREST_CATALOG_IMAGES_BY_HANDLE: Record<
  string,
  PinterestCatalogImageSource
> = {
  'utekos-techdown': {
    origin: 'shopify-files',
    imageFileName: 'TechDown-Havdyp-Master.png',
    additionalFileNames: [
      'TechDown-Havdyp-Kyst.png',
      'TechDown-Havdyp.png',
      'TechDown-Havdyp-Back.png',
      'TechDown-Havdyp-Front-Half.png',
      'Utekos-TechDown-Maritime-Blue-Group-2.png',
      'TechDown-Havdyp-Back-Half.png',
      'Utekos-TechDown-Maritime-Blue-Zipper.png'
    ]
  },
  'utekos-mikrofiber': {
    origin: 'shopify-files',
    imageFileName: 'Mikroriber-Card.png',
    additionalFileNames: [
      'Mikrofiber-Fjellbla-1.png',
      'Mikrofiber-Fjellbla-3.png',
      'Mikrofiber-Fjellbla-4.png'
    ]
  },
  'comfyrobe': {
    origin: 'first-party',
    imageFileName: 'Comfyrobe-XL-Dark-Blue.png',
    additionalFileNames: [
      'Comfyrobe-SherpaCore-Inside.png',
      'Comfyrobe-Plain-Open-Full-Front.png',
      'Comfyrobe-Hoodie-Details.png',
      'Comfyrobe-Backside.png',
      'Comfyrobe-Dark-Blue-Front.png',
      'Comfyrobe-Fjellnatt-Blue-XL-.png',
      'Comfyrobe-Lifestyle-Outside-Cabin.png',
      'Comfyrobe-Zipper.png'
    ]
  },
  'utekos-stapper': {
    origin: 'first-party',
    imageFileName: 'Utekos-Stapper-Dark-Background.png',
    additionalFileNames: ['Utekos-Stapper-Black.png']
  }
}

function buildFirstPartyCatalogImageUrl(fileName: string) {
  return `${MERCHANT_FEED_SITE_URL}${PINTEREST_CATALOG_PUBLIC_IMAGE_DIRECTORY}/${encodeURIComponent(fileName)}`
}

function resolveCatalogImageUrl(
  origin: PinterestCatalogImageOrigin,
  fileName: string
) {
  switch (origin) {
    case 'shopify-files':
      return buildShopifyFilesCdnUrl(fileName)
    case 'first-party':
      return buildFirstPartyCatalogImageUrl(fileName)
    default: {
      const exhaustive: never = origin
      throw new Error(
        `Unsupported Pinterest catalog image origin: ${exhaustive}`
      )
    }
  }
}

export function getPinterestCatalogImageSet(
  productHandle: string
): PinterestCatalogImageSet {
  const imageSource =
    PINTEREST_CATALOG_IMAGES_BY_HANDLE[productHandle]

  if (!imageSource) {
    throw new Error(
      `Pinterest catalog product ${productHandle} is missing dedicated public images`
    )
  }

  return pinterestCatalogImageSetSchema.parse({
    imageLink: resolveCatalogImageUrl(
      imageSource.origin,
      imageSource.imageFileName
    ),
    additionalImageLinks: imageSource.additionalFileNames.map(
      fileName =>
        resolveCatalogImageUrl(imageSource.origin, fileName)
    )
  })
}

export function listPinterestCatalogFirstPartyImageFileNames() {
  return Object.values(PINTEREST_CATALOG_IMAGES_BY_HANDLE)
    .filter(imageSource => imageSource.origin === 'first-party')
    .flatMap(imageSource => [
      imageSource.imageFileName,
      ...imageSource.additionalFileNames
    ])
}

export function listPinterestCatalogImageLinks() {
  return Object.keys(PINTEREST_CATALOG_IMAGES_BY_HANDLE).flatMap(
    productHandle => {
      const imageSet = getPinterestCatalogImageSet(productHandle)

      return [imageSet.imageLink, ...imageSet.additionalImageLinks]
    }
  )
}
