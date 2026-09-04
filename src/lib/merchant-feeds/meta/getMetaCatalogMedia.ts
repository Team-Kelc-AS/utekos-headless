import { MERCHANT_FEED_SITE_URL } from '@/lib/merchant-feeds/merchantFeedSiteUrl'
import { getPinterestCatalogImageUrls } from '@/lib/merchant-feeds/pinterest/getPinterestCatalogImageUrls'
import { slugifyVariantOption } from '@/lib/utils/slugifyVariantOption'

import type { MetaCatalogMediaAsset } from './metaCatalogOffer'

const META_CATALOG_VIDEO_URLS_BY_HANDLE: Record<
  string,
  readonly string[]
> = {
  comfyrobe: [],
  'utekos-dun': [],
  'utekos-mikrofiber': [],
  'utekos-stapper': [],
  'utekos-techdown': []
}

function assertCatalogMediaUrl(value: string) {
  const url = new URL(value)

  if (url.protocol !== 'https:') {
    throw new Error('Meta catalog media URLs must use HTTPS')
  }

  return url.toString()
}

export function getMetaCatalogMedia(input: {
  color: string
  productHandle: string
}) {
  const imageUrls =
    input.productHandle === 'utekos-dun' ?
      [`${MERCHANT_FEED_SITE_URL}/schema-bilder/utekos-dun.png`]
    : (() => {
        const images = getPinterestCatalogImageUrls(
          input.productHandle
        )

        return [images.imageLink, ...images.additionalImageLinks]
      })()
  const baseTags = [
    `family_${input.productHandle.replaceAll('-', '_')}`,
    `color_${slugifyVariantOption(input.color).replaceAll('-', '_')}`
  ]
  const images = imageUrls.map((url, index) => ({
    url: assertCatalogMediaUrl(url),
    tags: [index === 0 ? 'primary' : 'additional', ...baseTags]
  })) satisfies MetaCatalogMediaAsset[]
  const videoUrls =
    META_CATALOG_VIDEO_URLS_BY_HANDLE[input.productHandle]

  if (!videoUrls) {
    throw new Error(
      `Meta catalog product ${input.productHandle} is missing a media manifest`
    )
  }

  return {
    images,
    videos: videoUrls.map(url => ({
      url: assertCatalogMediaUrl(url),
      tags: ['product_video', ...baseTags]
    })) satisfies MetaCatalogMediaAsset[]
  }
}
