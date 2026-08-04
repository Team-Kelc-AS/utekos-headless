import { cacheLife, cacheTag } from 'next/cache'
import { SITE_URL } from '@/constants'
import type {
  BreadcrumbList,
  FAQPage,
  Graph,
  MerchantReturnPolicy,
  Offer,
  OfferShippingDetails,
  Organization,
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

function getShippingDetails(): OfferShippingDetails {
  return {
    '@type': 'OfferShippingDetails',
    'shippingRate': {
      '@type': 'MonetaryAmount',
      'value': '0',
      'currency': 'NOK'
    },
    'shippingDestination': {
      '@type': 'DefinedRegion',
      'addressCountry': 'NO'
    },
    'deliveryTime': {
      '@type': 'ShippingDeliveryTime',
      'handlingTime': {
        '@type': 'QuantitativeValue',
        'minValue': 0,
        'maxValue': 1,
        'unitCode': 'DAY'
      },
      'transitTime': {
        '@type': 'QuantitativeValue',
        'minValue': 1,
        'maxValue': 4,
        'unitCode': 'DAY'
      }
    }
  }
}

function getMerchantReturnPolicy(): MerchantReturnPolicy {
  return {
    '@type': 'MerchantReturnPolicy',
    'applicableCountry': 'NO',
    'returnPolicyCategory':
      'https://schema.org/MerchantReturnFiniteReturnWindow',
    'merchantReturnDays': 14,
    'returnMethod': 'https://schema.org/ReturnByMail',
    'returnFees': 'https://schema.org/FreeReturn',
    'refundType': 'https://schema.org/FullRefund',
    'url': `${SITE_URL}/frakt-og-retur`
  }
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
  const priceValidUntil = new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  )
    .toISOString()
    .slice(0, 10)

  const organizationNode: Organization = {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    'name': 'Utekos',
    'url': SITE_URL,
    'logo': `${SITE_URL}/logo.png`,
    'sameAs': [
      'https://www.facebook.com/utekosen',
      'https://www.instagram.com/utekos.no'
    ]
  }

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
        'priceValidUntil': priceValidUntil,
        'availability':
          availableForSale ?
            'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        'itemCondition': 'https://schema.org/NewCondition',
        'seller': { '@id': ORGANIZATION_ID },
        'shippingDetails': getShippingDetails(),
        'hasMerchantReturnPolicy': getMerchantReturnPolicy(),
        ...(compareAtPrice?.amount ?
          {
            'priceSpecification': {
              '@type': 'UnitPriceSpecification',
              'priceType': 'https://schema.org/ListPrice',
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
      organizationNode,
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
