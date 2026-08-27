import type { MetadataRoute } from 'next'

export const META_WEB_CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'meta-webindexer',
  'meta-externalads',
  'meta-externalagent',
  'meta-externalfetcher'
] as const

const PRIVATE_STOREFRONT_DISALLOWS = [
  '/cart/',
  '/account/',
  '/api/'
] as const

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://utekos.no'

  return {
    rules: [
      {
        userAgent: ['Googlebot', 'Googlebot-Video'],
        allow: [
          '/',
          '/videos/',
          '/api/google/feed',
          '/klarna-feed.xml',
          '/pinterest-catalog.tsv',
          '/snapchat-catalog.tsv'
        ],
        disallow: [...PRIVATE_STOREFRONT_DISALLOWS]
      },
      {
        userAgent: [...META_WEB_CRAWLER_USER_AGENTS],
        allow: '/',
        disallow: [...PRIVATE_STOREFRONT_DISALLOWS]
      },
      {
        userAgent: '*',
        allow: [
          '/',
          '/api/google/feed',
          '/klarna-feed.xml',
          '/pinterest-catalog.tsv',
          '/snapchat-catalog.tsv'
        ],
        disallow: [...PRIVATE_STOREFRONT_DISALLOWS, '/videos/']
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  }
}
