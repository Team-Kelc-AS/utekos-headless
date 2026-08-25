// Path: src/app/kampanje/julegaver/lokal-levering/BergenDeliveryJsonLd.tsx
import type { ShopifyProduct, ShopifyProductVariant } from 'types/product'
import { cacheLife, cacheTag } from 'next/cache'
import type {
  CollectionPage,
  WithContext,
  ListItem,
  OfferShippingDetails,
  MerchantReturnPolicy
} from 'schema-dts'

export async function BergenDeliveryJsonLd() {
  'use cache'
  cacheLife('max')
  cacheTag('campaign-bergen-delivery')
  const productVariant: ShopifyProductVariant = {} as ShopifyProductVariant
  const product: ShopifyProduct = {} as ShopifyProduct
  const productVendor: ShopifyProduct['vendor'] = product.vendor || 'Utekos®'
  const baseUrl = 'https://utekos.no'
  const currentUrl = `${baseUrl}/kampanje/julegaver/lokal-levering`
  const variantSku: ShopifyProductVariant['sku'] =
    productVariant.sku || undefined
  const priceValidUntil = new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  )
    .toISOString()
    .slice(0, 10)

  const localShippingDetails: OfferShippingDetails = {
    '@type': 'OfferShippingDetails',
    'shippingRate': {
      '@type': 'MonetaryAmount',
      'value': '0',
      'currency': 'NOK'
    },
    'shippingDestination': {
      '@type': 'DefinedRegion',
      'addressCountry': 'NO',
      'addressRegion': 'Bergen'
    },
    'deliveryTime': {
      '@type': 'ShippingDeliveryTime',
      'businessDays': {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': [
          'https://schema.org/Monday',
          'https://schema.org/Tuesday',
          'https://schema.org/Wednesday',
          'https://schema.org/Thursday',
          'https://schema.org/Friday',
          'https://schema.org/Saturday',
          'https://schema.org/Sunday'
        ]
      },
      'cutoffTime': '21:00:00+01:00',
      'handlingTime': {
        '@type': 'QuantitativeValue',
        'minValue': 0,
        'maxValue': 0,
        'unitCode': 'd'
      },
      'transitTime': {
        '@type': 'QuantitativeValue',
        'minValue': 0,
        'maxValue': 1,
        'unitCode': 'd'
      }
    }
  }

  const holidayReturnPolicy: MerchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy',
    'returnPolicyCategory':
      'https://schema.org/MerchantReturnFiniteReturnWindow',
    'merchantReturnDays': 60,
    'returnMethod': 'https://schema.org/ReturnByMail',
    'returnFees': 'https://schema.org/ReturnFeesCustomerResponsibility',
    'refundType': 'https://schema.org/FullRefund',
    'description': 'Utvidet bytterett frem til 15. januar for julegaver.'
  }

  const products = [
    {
      position: 1,
      name: 'Utekos TechDown™',
      url: `${baseUrl}/produkter/utekos-techdown`,
      image: `${baseUrl}/magasinet/techdown-1080.png`,
      price: '1990',
      originalPrice: '1990',
      variantSKU: `${variantSku}`,
      ratingValue: '92',
      bestRating: '100',
      ratingCount: '24',
      worstRating: '20',
      productId: '9240112693496',
      description:
        'Vår varmeste mest allsidige modell. Optimalisert etter erfaringer og tilbakemeldinger.'
    },
    {
      position: 2,
      name: 'Utekos Mikrofiber',
      url: `${baseUrl}/produkter/utekos-mikrofiber`,
      image: `${baseUrl}/magasinet/dun-front-hvit-bakgrunn-1080.png`,
      price: '1790',
      originalPrice: '1790',
      variantSKU: `${variantSku}`,
      ratingValue: '86',
      bestRating: '100',
      ratingCount: '14',
      worstRating: '20',

      description:
        'Lettvekt møter varme og allsidighet. Gir deg følelsen av dun med ekstra fordeler.'
    },
    {
      position: 3,
      name: 'Utekos Dun',
      url: `${baseUrl}/produkter/utekos-dun`,
      image: `${baseUrl}/magasinet/mikro-front-1080.png`,
      price: '2490',
      originalPrice: '3290',
      variantSKU: `${variantSku}`,
      ratingValue: '91',
      bestRating: '100',
      ratingCount: '34',
      worstRating: '20',
      description: 'Klassisk dun-kvalitet for de kaldeste dagene.'
    },
    {
      position: 4,
      name: 'Utekos Comfyrobe',
      url: `${baseUrl}/produkter/comfyrobe`,
      image: `${baseUrl}/magasinet/comfy-front-u-bakgrunn-1080.png`,
      price: '1290',
      originalPrice: '990',
      variantSKU: `${variantSku}`,
      ratingValue: '95',
      bestRating: '100',
      ratingCount: '11',
      worstRating: '20',
      description: 'Den ultimate skifteroben. Vindtett, vanntett og foret.'
    }
  ]

  const itemListElement: ListItem[] = products.map(product => ({
    '@type': 'ListItem',
    'position': product.position,
    'url': product.url,
    'item': {
      '@type': 'Product',
      'name': product.name,
      'description': product.description,
      'image': product.image,
      'url': product.url,
      'sku': product.variantSKU,
      'brand': productVendor,
      'offers': {
        '@type': 'Offer',
        'price': product.price,
        'priceCurrency': 'NOK',
        'availability': 'https://schema.org/InStock',
        'url': product.url,
        'priceSpecification': {
          '@type': 'UnitPriceSpecification',
          'priceType': 'https://schema.org/ListPrice',
          'price': product.originalPrice,
          'priceCurrency': 'NOK',
          'priceValidUntil': priceValidUntil
        },
        'areaServed': {
          '@type': 'City',
          'name': 'Bergen'
        },
        'hasMerchantReturnPolicy': holidayReturnPolicy,
        'shippingDetails': localShippingDetails
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': (
          products.reduce((sum, p) => sum + Number(p.ratingValue), 0)
          / products.length
        ).toFixed(1),
        'ratingCount': products.reduce(
          (sum, p) => sum + Number(p.ratingCount),
          0
        ),
        'bestRating': products.reduce(
          (max, p) => Math.max(max, Number(p.bestRating)),
          0
        ),
        'worstRating': products.reduce(
          (min, p) => Math.min(min, Number(p.worstRating)),
          Infinity
        )
      }
    }
  }))

  const jsonLd: WithContext<CollectionPage> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name':
      'Få årets varmeste julegave levert hjem – ferdig innpakket! | Bergen',
    'description':
      'Årets varmeste julegave! 🎁 Gi bort genial funksjonalitet som revolusjonerer opplevelsen av å være ute. Vi kjører ut bestillinger i Bergen hver dag frem til julaften.',

    'url': currentUrl,
    'spatialCoverage': {
      '@type': 'Place',
      'name': 'Bergen'
    },
    'mainEntity': {
      '@type': 'ItemList',
      'itemListElement': itemListElement,
      'numberOfItems': products.length
    }
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
