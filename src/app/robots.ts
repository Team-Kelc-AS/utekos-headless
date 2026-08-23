import type { MetadataRoute } from 'next'

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
        disallow: ['/cart/', '/account/', '/api/']
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
        disallow: ['/cart/', '/account/', '/api/', '/videos/']
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  }
}
