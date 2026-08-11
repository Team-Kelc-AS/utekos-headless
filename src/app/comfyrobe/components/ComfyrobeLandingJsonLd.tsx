import { cacheLife, cacheTag } from 'next/cache'
import { SITE_URL } from '@/constants'
import type {
  BreadcrumbList,
  FAQPage,
  Graph,
  Offer,
  Product,
  Question,
  WebPage
} from 'schema-dts'
import {
  COMFYROBE_LANDING_DESCRIPTION,
  COMFYROBE_LANDING_FAQ,
  COMFYROBE_LANDING_IMAGE,
  COMFYROBE_LANDING_NAME,
  COMFYROBE_LANDING_URL,
  COMFYROBE_PRODUCT_HANDLE,
  COMFYROBE_PRODUCT_URL
} from '../data/comfyrobeLandingSeo'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import { getComfyrobeLandingProduct } from '../lib/getComfyrobeLandingProduct'

const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`

function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export async function ComfyrobeLandingJsonLd() {
  'use cache'
  cacheLife('max')
  cacheTag(
    'comfyrobe-landing-jsonld',
    'products',
    `product-${COMFYROBE_PRODUCT_HANDLE}`
  )

  const product = await getComfyrobeLandingProduct()
  const price =
    product?.selectedOrFirstAvailableVariant?.price ??
    product?.priceRange?.minVariantPrice
  const compareAtPrice =
    product?.selectedOrFirstAvailableVariant?.compareAtPrice ??
    product?.compareAtPriceRange?.minVariantPrice
  const availableForSale =
    product?.selectedOrFirstAvailableVariant?.availableForSale ??
    product?.availableForSale ??
    false
  const breadcrumbNode: BreadcrumbList = {
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
        'name': 'Produkter',
        'item': `${SITE_URL}/produkter`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': 'Comfyrobe™',
        'item': COMFYROBE_LANDING_URL
      }
    ]
  }

  const faqNode: FAQPage = {
    '@type': 'FAQPage',
    '@id': `${COMFYROBE_LANDING_URL}#faq`,
    'mainEntity': COMFYROBE_LANDING_FAQ.map(
      ({ question, answer }): Question => ({
        '@type': 'Question',
        'name': question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': answer
        }
      })
    )
  }

  const offer: Offer | undefined =
    price?.amount ?
      {
        '@type': 'Offer',
        'url': `${COMFYROBE_LANDING_URL}#purchase-section`,
        'priceCurrency': price.currencyCode || 'NOK',
        'price': String(price.amount),
        'availability':
          availableForSale ?
            'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        'itemCondition': 'https://schema.org/NewCondition',
        'seller': { '@id': ORGANIZATION_ID },
        ...(compareAtPrice?.amount ?
          {
            'priceSpecification': {
              '@type': 'UnitPriceSpecification',
              'priceType':
                'https://schema.org/StrikethroughPrice',
              'price': String(compareAtPrice.amount),
              'priceCurrency': compareAtPrice.currencyCode || 'NOK'
            }
          }
        : {})
      }
    : undefined

  const productSku = product?.selectedOrFirstAvailableVariant?.sku

  const productNode: Product = {
    '@type': 'Product',
    '@id': `${COMFYROBE_PRODUCT_URL}#product`,
    'name': product?.title || 'Comfyrobe™',
    'description': COMFYROBE_LANDING_DESCRIPTION,
    'image': [
      product?.featuredImage?.url ?
        resolveImageSrc(product.featuredImage.url)
      : COMFYROBE_LANDING_IMAGE,
      COMFYROBE_LANDING_IMAGE
    ],
    'brand': {
      '@type': 'Brand',
      'name': product?.vendor || 'Utekos'
    },
    'url': COMFYROBE_LANDING_URL,
    ...(productSku ? { sku: productSku } : {}),
    ...(offer ? { offers: offer } : {})
  }

  const webpageNode: WebPage = {
    '@type': 'WebPage',
    '@id': `${COMFYROBE_LANDING_URL}#webpage`,
    'url': COMFYROBE_LANDING_URL,
    'name': COMFYROBE_LANDING_NAME,
    'description': COMFYROBE_LANDING_DESCRIPTION,
    'inLanguage': 'nb-NO',
    'isPartOf': { '@id': WEBSITE_ID },
    'about': { '@id': ORGANIZATION_ID },
    'primaryImageOfPage': {
      '@type': 'ImageObject',
      'url': COMFYROBE_LANDING_IMAGE,
      'width': '1600',
      'height': '1600',
      'caption': 'Kvinne med Comfyrobe fra Utekos'
    },
    'breadcrumb': { '@id': `${COMFYROBE_LANDING_URL}#breadcrumb` },
    'mainEntity': { '@id': `${COMFYROBE_PRODUCT_URL}#product` },
    'hasPart': { '@id': `${COMFYROBE_LANDING_URL}#faq` }
  }

  const graph: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      webpageNode,
      breadcrumbNode,
      productNode,
      faqNode
    ]
  }

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: stringifyJsonLd(graph) }}
    />
  )
}
