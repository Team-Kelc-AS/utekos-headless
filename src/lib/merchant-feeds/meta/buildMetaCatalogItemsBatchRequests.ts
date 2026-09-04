import type { MetaCatalogOffer } from './metaCatalogOffer'
import {
  metaCatalogItemsBatchRequestsSchema,
  type MetaCatalogItemsBatchRequest
} from './metaCatalogItemsBatchSchema'

function parseShippingPrice(value: string) {
  const match = /^(\d+\.\d{2}) (NOK)$/.exec(value)

  if (!match) {
    throw new Error(`Invalid Meta catalog shipping price "${value}"`)
  }

  const amount = match[1]
  const currency = match[2]

  if (!amount || currency !== 'NOK') {
    throw new Error(`Invalid Meta catalog shipping price "${value}"`)
  }

  return {
    currency: 'NOK' as const,
    value: amount
  }
}

function buildRequest(
  offer: MetaCatalogOffer
): MetaCatalogItemsBatchRequest {
  const [
    customLabel0,
    customLabel1,
    customLabel2,
    customLabel3,
    customLabel4
  ] = offer.customLabels
  const shippingPrice = parseShippingPrice(offer.shipping.price)

  return {
    method: 'UPDATE',
    data: {
      id: offer.id,
      title: offer.title,
      description: offer.description,
      rich_text_description: offer.richTextDescription,
      short_description: offer.shortDescription,
      availability: offer.availability,
      visibility: offer.visibility,
      condition: offer.condition,
      price: offer.price,
      ...(offer.salePrice ? { sale_price: offer.salePrice } : {}),
      link: offer.link,
      image: offer.images.map(asset => ({
        url: asset.url,
        tag: [...asset.tags]
      })),
      ...(offer.videos.length > 0 ?
        {
          video: offer.videos.map(asset => ({
            url: asset.url,
            tag: [...asset.tags]
          }))
        }
      : {}),
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
      shipping: [
        {
          shipping_country: offer.shipping.country,
          shipping_region: '',
          shipping_service: offer.shipping.service,
          shipping_price_value: shippingPrice.value,
          shipping_price_currency: shippingPrice.currency
        }
      ],
      shipping_weight: `${offer.shippingWeightValue} ${offer.shippingWeightUnit}`,
      internal_label: [...offer.internalLabels],
      custom_label_0: customLabel0,
      custom_label_1: customLabel1,
      custom_label_2: customLabel2,
      custom_label_3: customLabel3,
      custom_label_4: customLabel4,
      custom_number_0: offer.inventoryQuantity,
      ordering_index: offer.orderingIndex
    }
  }
}

export function buildMetaCatalogItemsBatchRequests(
  offers: readonly MetaCatalogOffer[]
) {
  return metaCatalogItemsBatchRequestsSchema.parse(
    offers.map(buildRequest)
  )
}
