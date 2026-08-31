import type {
  Graph,
  ItemList,
  ListItem,
  Offer,
  Product,
  SearchAction,
  SiteNavigationElement,
  VideoObject,
  WebPage,
  WebSite
} from 'schema-dts'
import { getFeaturedProducts } from '@/api/lib/products/getFeaturedProducts'
import { mainMenu } from '@/db/config/menu.config'
import { VIDEO_EMBED_URL, VIDEO_THUMBNAIL_URL, VIDEO_URL } from '@/constants'
import { SITE_URL } from '@/constants'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import { connection } from 'next/server'

const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`
const WEBPAGE_ID = `${SITE_URL}/#webpage`
const PRIMARY_IMAGE_ID = `${SITE_URL}/#primary-image`
const NAVIGATION_ID = `${SITE_URL}/#primary-navigation`
const FEATURED_PRODUCTS_ID = `${SITE_URL}/#featured-products`
const FRONT_PAGE_VIDEO_ID = `${SITE_URL}/#frontpage-video`
const HOME_PAGE_NAME = 'Utekos® Offisiell Nettbutikk | Skreddersy varmen'
const HOME_PAGE_DESCRIPTION =
  'Opplev kompromissløs komfort og overlegen allsidighet. Juster, form og nyt.'

type FeaturedProduct = Awaited<ReturnType<typeof getFeaturedProducts>>[number]

const sanitizeText = (value?: string | null) => {
  if (!value) return ''
  return value.replace(/\s+/g, ' ').trim()
}

const mapAvailability = (availableForSale: boolean) =>
  availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

const buildFeaturedProductListItem = (product: FeaturedProduct, index: number): ListItem => {
  const productUrl = `${SITE_URL}/produkter/${product.handle}`
  const description =
    sanitizeText(product.seo?.description) || sanitizeText(product.description) || product.title
  const minimumPrice = product.priceRange.minVariantPrice

  const offer: Offer = {
    '@type': 'Offer',
    'url': productUrl,
    'price': String(minimumPrice.amount),
    'priceCurrency': minimumPrice.currencyCode,
    'availability': mapAvailability(product.availableForSale),
    'itemCondition': 'https://schema.org/NewCondition',
    'seller': {
      '@id': ORGANIZATION_ID
    }
  }

  const productNode: Product = {
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    'name': product.title,
    'url': productUrl,
    'description': description,
    'brand': {
      '@type': 'Brand',
      'name': sanitizeText(product.vendor) || 'Utekos'
    },
    ...(product.featuredImage?.url ?
      { image: resolveImageSrc(product.featuredImage.url) }
    : {}),
    ...(product.productType ? { category: product.productType } : {}),
    'offers': offer
  }

  return {
    '@type': 'ListItem',
    'position': index + 1,
    'url': productUrl,
    'name': product.title,
    'item': productNode
  }
}

export async function FrontPageJsonLd() {
  await connection()
  const featuredProducts = (await getFeaturedProducts()).slice(0, 4)
  const navigationUrls = mainMenu.map(item => `${SITE_URL}${item.url}`)
  const featuredProductItems = featuredProducts.map(buildFeaturedProductListItem)

  const potentialAction: SearchAction = {
    '@type': 'SearchAction',
    'target': {
      '@type': 'EntryPoint',
      'urlTemplate': `${SITE_URL}/search?q={search_term_string}`
    },
    'query': 'required name=search_term_string'
  }

  const websiteNode: WebSite = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    'url': SITE_URL,
    'name': HOME_PAGE_NAME,
    'alternateName': 'Utekos',
    'description': HOME_PAGE_DESCRIPTION,
    'inLanguage': 'no-NO',
    'publisher': {
      '@id': ORGANIZATION_ID
    },
    'potentialAction': potentialAction
  }

  const navigationNode: SiteNavigationElement = {
    '@type': 'SiteNavigationElement',
    '@id': NAVIGATION_ID,
    'name': mainMenu.map(item => item.title),
    'url': navigationUrls
  }

  const videoNode: VideoObject = {
    '@type': 'VideoObject',
    '@id': FRONT_PAGE_VIDEO_ID,
    'name': 'Slutt å fryse. Begynn å nyte.',
    'description':
      'Er du lei av å la kulden ødelegge de gode øyeblikkene ute? Utekos er løsningen som holder deg varm og komfortabel.',
    'thumbnailUrl': [VIDEO_THUMBNAIL_URL],
    'uploadDate': '2026-01-04T00:00:00+01:00',
    'duration': 'PT30S',
    'contentUrl': VIDEO_URL,
    'embedUrl': VIDEO_EMBED_URL,
    'inLanguage': 'no-NO',
    'isPartOf': {
      '@id': WEBPAGE_ID
    },
    'publisher': {
      '@id': ORGANIZATION_ID
    }
  }

  const webpageNode: WebPage = {
    '@type': 'WebPage',
    '@id': WEBPAGE_ID,
    'url': SITE_URL,
    'name': HOME_PAGE_NAME,
    'description': HOME_PAGE_DESCRIPTION,
    'inLanguage': 'no-NO',
    'isPartOf': {
      '@id': WEBSITE_ID
    },
    'about': {
      '@id': ORGANIZATION_ID
    },
    'primaryImageOfPage': {
      '@type': 'ImageObject',
      '@id': PRIMARY_IMAGE_ID,
      'url': `${SITE_URL}/webp/kaffe-med-tilpasset-utekos-mikrofiber-vinter-terrasse-.webp`,
      'width': '1200',
      'height': '630',
      'caption': 'To kvinner som koser seg utendørs på terrassen med varme komfortplagg fra Utekos.'
    },
    'significantLink': [
      `${SITE_URL}`,
      `${SITE_URL}/skreddersy-varmen`,
      `${SITE_URL}/produkter/utekos-techdown`,
      `${SITE_URL}/kontaktskjema`,
      `${SITE_URL}/`
    ],
    ...(featuredProductItems.length > 0 ?
      {
        mainEntity: {
          '@id': FEATURED_PRODUCTS_ID
        }
      }
    : {})
  }

  const graphNodes: NonNullable<Graph['@graph']>[number][] = [
    websiteNode,
    webpageNode,
    navigationNode,
    videoNode
  ]

  if (featuredProductItems.length > 0) {
    const featuredProductsNode: ItemList = {
      '@type': 'ItemList',
      '@id': FEATURED_PRODUCTS_ID,
      'name': 'Kundenes favoritter',
      'description': 'Utvalgte Utekos-produkter som fremheves på forsiden akkurat nå.',
      'url': SITE_URL,
      'numberOfItems': featuredProductItems.length,
      'itemListOrder': 'https://schema.org/ItemListOrderAscending',
      'itemListElement': featuredProductItems
    }

    graphNodes.push(featuredProductsNode)
  }

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': graphNodes
  }

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
      }}
    />
  )
}
