// Path: src/app/kampanje/julegaver/ChristmasCampaignJsonLd.tsx

import { cacheLife, cacheTag } from 'next/cache'
import type { CollectionPage, WithContext, ListItem } from 'schema-dts'
export async function ChristmasCampaignJsonLd() {
  'use cache'
  cacheLife('max')
  cacheTag('campaign-julegaver')

  const baseUrl = 'https://utekos.no'

  const products = [
    {
      position: 1,
      name: 'Utekos TechDown™',
      url: `${baseUrl}/produkter/utekos-techdown`,
      image: `${baseUrl}/magasinet/techdown-1080.png`,
      price: '1990',
      originalPrice: '1990',
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
      description: 'Klassisk dun-kvalitet for de kaldeste dagene.'
    },
    {
      position: 4,
      name: 'Utekos Comfyrobe',
      url: `${baseUrl}/produkter/comfyrobe`,
      image: `${baseUrl}/magasinet/comfy-front-u-bakgrunn-1080.png`,
      price: '999',
      originalPrice: '1690',
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
      'offers': {
        '@type': 'Offer',
        'price': product.price,
        'priceCurrency': 'NOK',
        'priceSpecification': {
          '@type': 'UnitPriceSpecification',
          'priceType': 'https://schema.org/ListPrice',
          'price': product.originalPrice
        },
        'availability': 'https://schema.org/InStock',
        'url': product.url
      }
    }
  }))

  const jsonLd: WithContext<CollectionPage> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'Julegavetips | Utekos',
    'description': 'Gi bort funksjonell varme | Julegavetips fra Utekos.',
    'url': `${baseUrl}/kampanje/julegaver`,
    'mainEntity': {
      '@type': 'ItemList',
      'itemListElement': itemListElement
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
