// Path: src/app/sitemap.ts
import { getProducts } from '@/api/lib/products/getProducts'
import { getMagazineArticles } from '@/app/magasinet/utils/getMagazineArticles'
import { toAbsoluteUrl } from '@/app/magasinet/utils/toAbsoluteUrl'
import { returnPolicy } from '@/lib/policies/returnPolicy'
import type { MetadataRoute } from 'next'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://utekos.no'
  const lastModifiedISO = new Date().toISOString()

  const corePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: lastModifiedISO,
      changeFrequency: 'weekly',
      priority: 1.0
    },
    {
      url: `${baseUrl}/produkter`,
      lastModified: lastModifiedISO,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/magasinet`,
      lastModified: lastModifiedISO,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/gaveguide`,
      lastModified: lastModifiedISO,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/nbcc`,
      lastModified: lastModifiedISO,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/skreddersy-varmen`,
      lastModified: lastModifiedISO,
      changeFrequency: 'weekly',
      priority: 0.95
    },
    {
      url: `${baseUrl}/skreddersy-varmen/utekos-orginal`,
      lastModified: lastModifiedISO,
      changeFrequency: 'weekly',
      priority: 0.2
    }
  ]

  const inspirationPaths = [
    '/inspirasjon',
    '/inspirasjon/batliv',
    '/inspirasjon/bobil',
    '/inspirasjon/grillkvelden',
    '/inspirasjon/hytteliv',
    '/inspirasjon/terrassen'
  ]
  const inspirationPages: MetadataRoute.Sitemap =
    inspirationPaths.map(path => ({
      url: `${baseUrl}${path}`,
      lastModified: lastModifiedISO,
      changeFrequency: 'monthly',
      priority: 0.7
    }))

  const utilityPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/kontaktskjema`,
      lastModified: lastModifiedISO,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${baseUrl}/personvern`,
      lastModified: lastModifiedISO,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${baseUrl}/frakt-og-retur`,
      lastModified: returnPolicy.lastUpdated,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${baseUrl}/om-oss`,
      lastModified: lastModifiedISO,
      changeFrequency: 'monthly',
      priority: 0.5
    },
    {
      url: `${baseUrl}/handlehjelp/sammenlign-modeller`,
      lastModified: lastModifiedISO,
      changeFrequency: 'monthly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/handlehjelp/storrelsesguide`,
      lastModified: lastModifiedISO,
      changeFrequency: 'monthly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/handlehjelp/teknologi-materialer`,
      lastModified: lastModifiedISO,
      changeFrequency: 'monthly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/handlehjelp/vask-og-vedlikehold`,
      lastModified: lastModifiedISO,
      changeFrequency: 'monthly',
      priority: 0.6
    }
  ]

  const productsResponse = await getProducts()

  const productUrls: MetadataRoute.Sitemap =
    productsResponse.success && productsResponse.body ?
      productsResponse.body.map(product => ({
        url: `${baseUrl}/produkter/${product.handle}`,
        lastModified:
          (
            typeof product.updatedAt === 'string' &&
            product.updatedAt
          ) ?
            product.updatedAt
          : lastModifiedISO,
        changeFrequency: 'weekly',
        priority: 0.8,
        images:
          product.featuredImage ?
            [toAbsoluteUrl(product.featuredImage.url)]
          : []
      }))
    : []

  const articles = await getMagazineArticles()

  const articleUrls: MetadataRoute.Sitemap = articles.map(
    article => ({
      url: `${baseUrl}/magasinet/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
      images: [toAbsoluteUrl(article.heroImage.src)]
    })
  )

  return [
    ...corePages,
    ...inspirationPages,
    ...utilityPages,
    ...productUrls,
    ...articleUrls
  ]
}
