import { SITE_URL } from '@/constants'
import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { getSchemaOrgGtinData } from '@/lib/gtin/getSchemaOrgGtinData'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import {
  COMFYROBE_LANDING_DESCRIPTION,
  COMFYROBE_LANDING_IMAGE,
  COMFYROBE_LANDING_NAME,
  COMFYROBE_LANDING_URL
} from '../data/comfyrobeLandingSeo'
import type { ShopifyProduct } from 'types/product'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`
const PRODUCT_ID = `${COMFYROBE_LANDING_URL}#product`

function isXlVariant(variant: ShopifyProductVariant): boolean {
  return variant.selectedOptions.some(
    option =>
      option.name === 'Størrelse' && option.value === 'XL'
  )
}

function getComfyrobeXlVariant(
  product: ShopifyProduct
): ShopifyProductVariant | null {
  return (
    product.variants.edges.find(({ node }) => isXlVariant(node))
      ?.node ?? null
  )
}

function buildPriceSpecification(
  variant: ShopifyProductVariant
) {
  const price = Number(variant.price.amount)
  const compareAtPrice = Number(variant.compareAtPrice?.amount)

  if (
    !variant.compareAtPrice ||
    !Number.isFinite(price) ||
    !Number.isFinite(compareAtPrice) ||
    compareAtPrice <= price
  ) {
    return undefined
  }

  return {
    '@type': 'UnitPriceSpecification',
    'priceType': 'https://schema.org/StrikethroughPrice',
    'price': variant.compareAtPrice.amount,
    'priceCurrency': variant.compareAtPrice.currencyCode
  }
}

export function buildComfyrobeJsonLd(product: ShopifyProduct) {
  const variant = getComfyrobeXlVariant(product)

  if (!variant) {
    throw new Error('Comfyrobe landing requires an XL variant.')
  }

  const image = variant.image?.url ?? product.featuredImage?.url
  const priceSpecification = buildPriceSpecification(variant)
  const validGtin = isValidGtin(variant.barcode)

  const productNode = {
    '@type': 'Product',
    '@id': PRODUCT_ID,
    'name': `${product.title} XL`,
    'url': COMFYROBE_LANDING_URL,
    'description': COMFYROBE_LANDING_DESCRIPTION,
    'brand': {
      '@type': 'Brand',
      'name': product.vendor || 'Utekos'
    },
    'size': 'XL',
    ...(variant.sku ? { sku: variant.sku } : {}),
    ...(validGtin ? getSchemaOrgGtinData(variant.barcode) : {}),
    'image':
      image ? resolveImageSrc(image) : COMFYROBE_LANDING_IMAGE,
    'offers': {
      '@type': 'Offer',
      'url': `${COMFYROBE_LANDING_URL}#purchase-section`,
      'price': variant.price.amount,
      'priceCurrency': variant.price.currencyCode,
      'availability':
        variant.availableForSale ?
          'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      'itemCondition': 'https://schema.org/NewCondition',
      'seller': { '@id': ORGANIZATION_ID },
      ...(priceSpecification ? { priceSpecification } : {})
    }
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemPage',
        '@id': `${COMFYROBE_LANDING_URL}#webpage`,
        'url': COMFYROBE_LANDING_URL,
        'name': COMFYROBE_LANDING_NAME,
        'description': COMFYROBE_LANDING_DESCRIPTION,
        'inLanguage': 'nb-NO',
        'dateModified': product.updatedAt,
        'isPartOf': { '@id': WEBSITE_ID },
        'publisher': { '@id': ORGANIZATION_ID },
        'breadcrumb': {
          '@id': `${COMFYROBE_LANDING_URL}#breadcrumb`
        },
        'mainEntity': { '@id': PRODUCT_ID }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${COMFYROBE_LANDING_URL}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Forsiden',
            'item': SITE_URL
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Comfyrobe™ XL',
            'item': COMFYROBE_LANDING_URL
          }
        ]
      },
      productNode
    ]
  }
}
