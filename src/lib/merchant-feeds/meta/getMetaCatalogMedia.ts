import { MERCHANT_FEED_SITE_URL } from '@/lib/merchant-feeds/merchantFeedSiteUrl'
import { getPinterestCatalogImageUrls } from '@/lib/merchant-feeds/pinterest/getPinterestCatalogImageUrls'
import { slugifyVariantOption } from '@/lib/utils/slugifyVariantOption'

import { META_CATALOG_ADDITIONAL_IMAGES_BY_VARIANT } from './metaCatalogAdditionalImages'
import {
  META_CATALOG_IMAGE_PREFERENCE_TAGS,
  META_CATALOG_IMAGE_TAGS
} from './metaCatalogImageTags'
import {
  META_CATALOG_MEDIA_MANIFEST_BY_HANDLE,
  type MetaCatalogCuratedImage
} from './metaCatalogMediaManifest'
import type { MetaCatalogMediaAsset } from './metaCatalogOffer'
import { META_TECHDOWN_VARIANT_IMAGES } from './metaTechDownVariantImages'
import { prioritizeMetaCatalogImages } from './prioritizeMetaCatalogImages'

function assertCatalogMediaUrl(value: string) {
  const url = new URL(value)

  if (url.protocol !== 'https:') {
    throw new Error('Meta catalog media URLs must use HTTPS')
  }

  return url.toString()
}

export function getMetaCatalogMedia(input: {
  color: string
  curatedImages?: readonly MetaCatalogCuratedImage[]
  productHandle: string
  retailerId?: string
}) {
  const manifest =
    META_CATALOG_MEDIA_MANIFEST_BY_HANDLE[
      input.productHandle as keyof typeof META_CATALOG_MEDIA_MANIFEST_BY_HANDLE
    ]

  if (!manifest) {
    throw new Error(
      `Meta catalog product ${input.productHandle} is missing a media manifest`
    )
  }

  const imageUrls =
    !manifest.includeDefaultImages ? []
    : input.productHandle === 'utekos-dun' ?
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
  const images: { url: string; tags: string[] }[] =
    imageUrls.map((url, index) => ({
      url: assertCatalogMediaUrl(url),
      tags: [
        index === 0 ?
          META_CATALOG_IMAGE_TAGS.primary
        : META_CATALOG_IMAGE_TAGS.additional,
        ...baseTags
      ]
    }))
  const variantImages =
    (
      input.productHandle === 'utekos-techdown' &&
      input.retailerId
    ) ?
      META_TECHDOWN_VARIANT_IMAGES[input.retailerId]
    : undefined
  const additionalImages =
    input.retailerId ?
      (META_CATALOG_ADDITIONAL_IMAGES_BY_VARIANT[
        input.productHandle
      ]?.[input.retailerId] ?? [])
    : []
  const curatedImages = input.curatedImages ?? [
    ...(variantImages ?? manifest.images),
    ...additionalImages
  ]

  for (const curatedImage of curatedImages) {
    const url = assertCatalogMediaUrl(curatedImage.url)
    const preferenceTags = curatedImage.preferences.flatMap(
      preference =>
        META_CATALOG_IMAGE_PREFERENCE_TAGS[preference]
    )

    if (preferenceTags.length === 0) {
      throw new Error(
        `Meta catalog curated image ${url} is missing a placement preference`
      )
    }

    const existing = images.find(image => image.url === url)
    const tags = [...new Set([...preferenceTags, ...baseTags])]

    if (existing) {
      existing.tags = [...new Set([...existing.tags, ...tags])]
    } else {
      images.push({ url, tags })
    }
  }

  if (images.length > 21) {
    throw new Error(
      `Meta catalog product ${input.productHandle} exceeds 21 images`
    )
  }

  if (manifest.videos.length > 20) {
    throw new Error(
      `Meta catalog product ${input.productHandle} exceeds 20 videos`
    )
  }

  return {
    images: prioritizeMetaCatalogImages(images, curatedImages),
    videos: manifest.videos.map(url => ({
      url: assertCatalogMediaUrl(url),
      tags: ['product_video', ...baseTags]
    })) satisfies MetaCatalogMediaAsset[]
  }
}
