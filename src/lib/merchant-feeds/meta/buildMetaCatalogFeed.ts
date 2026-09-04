import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'

import { buildMetaCatalogOffers } from './buildMetaCatalogOffers'
import type { MetaCatalogOffer } from './metaCatalogOffer'

export const META_CATALOG_FEED_COLUMNS = [
  'id',
  'title',
  'description',
  'rich_text_description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'brand',
  'item_group_id',
  'google_product_category',
  'fb_product_category',
  'product_type',
  'gtin',
  'mpn',
  'color',
  'size',
  'gender',
  'age_group',
  'material',
  'sale_price',
  'additional_image_link',
  'shipping',
  'shipping_weight',
  'internal_label',
  'status',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'custom_label_3',
  'custom_label_4',
  'video[0].url',
  'video[1].url',
  'video[2].url'
] as const

type MetaCatalogFeedColumn =
  (typeof META_CATALOG_FEED_COLUMNS)[number]

type MetaCatalogFeedRow = Record<MetaCatalogFeedColumn, string>

export type MetaCatalogFeedDocument = {
  tsv: string
  lastModified: string
  offerCount: number
}

function encodeFeedUrl(value: string) {
  return value.replaceAll(',', '%2C')
}

function buildFeedRow(offer: MetaCatalogOffer): MetaCatalogFeedRow {
  const [customLabel0, customLabel1, customLabel2, customLabel3, customLabel4] =
    offer.customLabels

  return {
    id: offer.id,
    title: offer.title,
    description: offer.description,
    rich_text_description: offer.richTextDescription,
    availability: offer.availability,
    condition: offer.condition,
    price: offer.price,
    link: offer.link,
    image_link: encodeFeedUrl(offer.images[0]?.url ?? ''),
    brand: offer.brand,
    item_group_id: offer.itemGroupId,
    google_product_category: offer.googleProductCategory,
    fb_product_category: offer.facebookProductCategory,
    product_type: offer.productType,
    gtin: offer.gtin,
    mpn: offer.mpn,
    color: offer.color,
    size: offer.size,
    gender: offer.gender,
    age_group: offer.ageGroup,
    material: offer.material,
    sale_price: offer.salePrice ?? '',
    additional_image_link: offer.images
      .slice(1)
      .map(image => encodeFeedUrl(image.url))
      .join(','),
    shipping: `${offer.shipping.country}::${offer.shipping.service}:${offer.shipping.price}`,
    shipping_weight: `${offer.shippingWeightValue} ${offer.shippingWeightUnit}`,
    internal_label: JSON.stringify(offer.internalLabels),
    status: 'active',
    custom_label_0: customLabel0,
    custom_label_1: customLabel1,
    custom_label_2: customLabel2,
    custom_label_3: customLabel3,
    custom_label_4: customLabel4,
    'video[0].url': offer.videos[0]?.url ?? '',
    'video[1].url': offer.videos[1]?.url ?? '',
    'video[2].url': offer.videos[2]?.url ?? ''
  }
}

export function buildMetaCatalogFeedDocument(
  products: CatalogSyncProduct[]
): MetaCatalogFeedDocument {
  const offers = buildMetaCatalogOffers(products).filter(
    offer => offer.visibility === 'published'
  )

  if (offers.length === 0) {
    throw new Error(
      'Meta catalog feed contains no active in-stock offers'
    )
  }

  const lines = [
    META_CATALOG_FEED_COLUMNS.join('\t'),
    ...offers.map(offer => {
      const row = buildFeedRow(offer)

      return META_CATALOG_FEED_COLUMNS.map(
        column => row[column]
      ).join('\t')
    })
  ]

  return {
    tsv: `${lines.join('\r\n')}\r\n`,
    lastModified: new Date(
      Math.max(...offers.map(offer => offer.updatedAtMs))
    ).toUTCString(),
    offerCount: offers.length
  }
}

export function buildMetaCatalogFeed(
  products: CatalogSyncProduct[]
) {
  return buildMetaCatalogFeedDocument(products).tsv
}
