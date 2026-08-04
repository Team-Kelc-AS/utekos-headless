// Path: src/app/skreddersy-varmen/utekos-orginal/components/LandingPageJsonLd.tsx
import { cacheLife, cacheTag } from 'next/cache'
import { reviews } from '../../data/reviews'
import {
  LANDING_AUTHOR_NAME,
  LANDING_BASE_URL,
  LANDING_FAQ_ENTRIES,
  LANDING_LAST_UPDATED,
  LANDING_PAGE_URL,
  LANDING_PRODUCTS
} from '../../data/landingSeoContent'
import type {
  AggregateRating,
  BreadcrumbList,
  CollectionPage,
  FAQPage,
  Graph,
  ItemList,
  ListItem,
  Organization,
  Product,
  Question,
  Review
} from 'schema-dts'

function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export async function SkreddersyVarmenJsonLd() {
  'use cache'
  cacheLife('max')
  cacheTag('landing-page', 'skreddersy-varmen-jsonld')

  const organizationNode: Organization = {
    '@type': 'Organization',
    '@id': `${LANDING_BASE_URL}/#organization`,
    'name': 'Utekos',
    'url': LANDING_BASE_URL,
    'logo': `${LANDING_BASE_URL}/logo.png`,
    'sameAs': ['https://www.instagram.com/utekos.no']
  }

  const authorNode: Organization = {
    '@type': 'Organization',
    '@id': `${LANDING_PAGE_URL}#author`,
    'name': LANDING_AUTHOR_NAME,
    'url': `${LANDING_BASE_URL}/om-oss`,
    'parentOrganization': {
      '@id': `${LANDING_BASE_URL}/#organization`
    }
  }

  const aggregateRating: AggregateRating = {
    '@type': 'AggregateRating',
    'ratingValue': (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
    'bestRating': '5',
    'worstRating': '1',
    'reviewCount': reviews.length
  }

  const reviewNodes: Review[] = reviews.map(r => ({
    '@type': 'Review',
    'name': r.title ?? `Anmeldelse av ${r.name}`,
    'reviewBody': r.quote,
    'author': {
      '@type': 'Person',
      'name': r.name
    },
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': String(r.rating),
      'bestRating': '5',
      'worstRating': '1'
    }
  }))

  const productNodes: Product[] = LANDING_PRODUCTS.map(product => ({
    '@type': 'Product',
    '@id': `${LANDING_BASE_URL}/produkter/${product.handle}#product`,
    'name': product.name,
    'description': product.description,
    'image': product.image,
    'sku': product.sku,
    'brand': {
      '@type': 'Brand',
      'name': 'Utekos'
    },
    'url': `${LANDING_BASE_URL}/produkter/${product.handle}`,
    'offers': {
      '@type': 'Offer',
      'url': `${LANDING_BASE_URL}/produkter/${product.handle}`,
      'priceCurrency': 'NOK',
      'price': product.price,
      'priceSpecification': {
        '@type': 'UnitPriceSpecification',
        'priceType': 'https://schema.org/ListPrice',
        'price': product.originalPrice,
        'priceCurrency': 'NOK'
      },
      'availability': 'https://schema.org/InStock',
      'itemCondition': 'https://schema.org/NewCondition',
      'shippingDetails': {
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
            'minValue': 2,
            'maxValue': 5,
            'unitCode': 'DAY'
          }
        }
      },
      'hasMerchantReturnPolicy': {
        '@type': 'MerchantReturnPolicy',
        'applicableCountry': 'NO',
        'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
        'merchantReturnDays': 14,
        'returnMethod': 'https://schema.org/ReturnByMail',
        'returnFees': 'https://schema.org/FreeReturn'
      }
    },
    'aggregateRating': aggregateRating,
    'review': reviewNodes
  }))

  const itemListElement: ListItem[] = LANDING_PRODUCTS.map(product => ({
    '@type': 'ListItem',
    'position': product.position,
    'url': `${LANDING_BASE_URL}/produkter/${product.handle}`,
    'item': {
      '@id': `${LANDING_BASE_URL}/produkter/${product.handle}#product`
    }
  }))

  const productListNode: ItemList = {
    '@type': 'ItemList',
    '@id': `${LANDING_PAGE_URL}#products`,
    'name': 'Utekos-modeller for justerbar varme',
    'itemListElement': itemListElement
  }

  const breadcrumbNode: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    '@id': `${LANDING_PAGE_URL}#breadcrumb`,
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Forsiden',
        'item': LANDING_BASE_URL
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Skreddersy varmen',
        'item': LANDING_PAGE_URL
      }
    ]
  }

  const faqNode: FAQPage = {
    '@type': 'FAQPage',
    '@id': `${LANDING_PAGE_URL}#faq`,
    'mainEntity': LANDING_FAQ_ENTRIES.map(
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

  const collectionNode: CollectionPage = {
    '@type': 'CollectionPage',
    '@id': `${LANDING_PAGE_URL}#webpage`,
    'name': 'Skreddersy varmen ute | Utekos 3-i-1 komfortplagg',
    'description':
      'Kjøpsnær guide til Utekos for terrasse, hytte, båt og bobil med 3-i-1-funksjon, fuktbeskyttelse, størrelse, levering og retur.',
    'url': LANDING_PAGE_URL,
    'dateModified': LANDING_LAST_UPDATED,
    'inLanguage': 'nb-NO',
    'isPartOf': {
      '@id': `${LANDING_BASE_URL}/#website`
    },
    'author': {
      '@id': `${LANDING_PAGE_URL}#author`
    },
    'publisher': {
      '@id': `${LANDING_BASE_URL}/#organization`
    },
    'breadcrumb': {
      '@id': `${LANDING_PAGE_URL}#breadcrumb`
    },
    'mainEntity': {
      '@id': `${LANDING_PAGE_URL}#products`
    }
  }

  const graph: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode,
      authorNode,
      breadcrumbNode,
      collectionNode,
      productListNode,
      ...productNodes,
      faqNode
    ]
  }

  return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: stringifyJsonLd(graph) }} />
}
