// Path: src/app/sitemap.ts
import { getProducts } from '@/api/lib/products/getProducts'
import { getMagazineArticles } from '@/app/magasinet/utils/getMagazineArticles'
import { toAbsoluteUrl } from '@/app/magasinet/utils/toAbsoluteUrl'
import { returnPolicy } from '@/lib/policies/returnPolicy'
import { getProductPresentation } from '@/lib/products/presentation'
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://utekos.no'
const SKREDDERSY_VARMEN_LAST_MODIFIED = '2026-08-11'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const corePages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      changeFrequency: 'weekly',
      priority: 1.0
    },
    {
      url: `${BASE_URL}/produkter`,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${BASE_URL}/magasinet`,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${BASE_URL}/gaveguide`,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${BASE_URL}/nbcc`,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${BASE_URL}/skreddersy-varmen`,
      lastModified: SKREDDERSY_VARMEN_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.95
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
      url: `${BASE_URL}${path}`,
      changeFrequency: 'monthly',
      priority: 0.7
    }))

  const utilityPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/kontaktskjema`,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${BASE_URL}/personvern`,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${BASE_URL}/frakt-og-retur`,
      lastModified: returnPolicy.lastUpdated,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${BASE_URL}/om-oss`,
      changeFrequency: 'monthly',
      priority: 0.5
    },
    {
      url: `${BASE_URL}/handlehjelp/sammenlign-modeller`,
      changeFrequency: 'monthly',
      priority: 0.6
    },
    {
      url: `${BASE_URL}/handlehjelp/storrelsesguide`,
      changeFrequency: 'monthly',
      priority: 0.6
    },
    {
      url: `${BASE_URL}/handlehjelp/teknologi-materialer`,
      changeFrequency: 'monthly',
      priority: 0.6
    },
    {
      url: `${BASE_URL}/handlehjelp/vask-og-vedlikehold`,
      changeFrequency: 'monthly',
      priority: 0.6
    }
  ]

  const productsResponse = await getProducts()

  const productUrls: MetadataRoute.Sitemap =
    productsResponse.success && productsResponse.body ?
      productsResponse.body.flatMap(product => {
        const presentation = getProductPresentation(product.handle)

        if (!presentation) return []

        return [
          {
            url: presentation.canonicalUrl,
            ...(product.updatedAt ?
              { lastModified: product.updatedAt }
            : {}),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
            images:
              product.featuredImage ?
                [toAbsoluteUrl(product.featuredImage.url)]
              : []
          }
        ]
      })
    : []

  const articles = await getMagazineArticles()

  const articleUrls: MetadataRoute.Sitemap = articles.map(
    article => ({
      url: `${BASE_URL}/magasinet/${article.slug}`,
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
