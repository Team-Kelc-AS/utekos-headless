import type { Metadata } from 'next'
import type { BreadcrumbList, Graph } from 'schema-dts'
import { z } from 'zod'

const SITE_ORIGIN = 'https://utekos.no'
const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`
const WEBSITE_ID = `${SITE_ORIGIN}/#website`

const breadcrumbSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1)
})

const aboutPageFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  canonical: z.string().min(1),
  rawMarkdownPath: z.string().min(1),
  siteName: z.string().min(1),
  locale: z.string().min(1),
  inLanguage: z.string().min(1),
  publishedTime: z.string().min(1),
  modifiedTime: z.string().min(1),
  ogImage: z.object({
    url: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: z.string().min(1)
  }),
  breadcrumbs: z.array(breadcrumbSchema).min(1),
  dependencies: z.array(z.string().min(1)).default([]),
  ai_directive: z.string().min(1)
})

export type AboutPageFrontmatter = z.infer<typeof aboutPageFrontmatterSchema>

export function parseAboutPageFrontmatter(frontmatter: unknown): AboutPageFrontmatter {
  return aboutPageFrontmatterSchema.parse(frontmatter)
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_ORIGIN).toString()
}

function withFragment(url: string, fragment: string): string {
  return `${url}/#${fragment}`
}

export function buildAboutPageMetadata(frontmatter: unknown): Metadata {
  const page = parseAboutPageFrontmatter(frontmatter)

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: page.canonical
    },
    robots: {
      index: true,
      follow: true
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.canonical,
      siteName: page.siteName,
      locale: page.locale,
      type: 'website',
      images: [
        {
          url: page.ogImage.url,
          width: page.ogImage.width,
          height: page.ogImage.height,
          alt: page.ogImage.alt
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [page.ogImage.url]
    },
    other: {
      'raw-markdown': page.rawMarkdownPath
    }
  }
}

export function buildAboutPageJsonLd(frontmatter: unknown): Graph {
  const page = parseAboutPageFrontmatter(frontmatter)
  const canonicalUrl = toAbsoluteUrl(page.canonical)
  const imageUrl = toAbsoluteUrl(page.ogImage.url)
  const webpageId = withFragment(canonicalUrl, 'webpage')
  const primaryImageId = withFragment(canonicalUrl, 'primaryimage')
  const articleId = withFragment(canonicalUrl, 'article')
  const breadcrumbId = withFragment(canonicalUrl, 'breadcrumb')

  const breadcrumbNode: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    '@id': breadcrumbId,
    itemListElement: page.breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path)
    }))
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': webpageId,
        url: canonicalUrl,
        name: page.title,
        description: page.description,
        inLanguage: page.inLanguage,
        isPartOf: {
          '@id': WEBSITE_ID
        },
        about: {
          '@id': ORGANIZATION_ID
        },
        primaryImageOfPage: {
          '@id': primaryImageId
        },
        breadcrumb: {
          '@id': breadcrumbId
        },
        mainEntity: {
          '@id': ORGANIZATION_ID
        }
      },
      {
        '@type': 'ImageObject',
        '@id': primaryImageId,
        url: imageUrl,
        width: String(page.ogImage.width),
        height: String(page.ogImage.height),
        caption: page.ogImage.alt
      },
      {
        '@type': 'Article',
        '@id': articleId,
        isPartOf: {
          '@id': webpageId
        },
        headline: page.title,
        description: page.description,
        image: {
          '@id': primaryImageId
        },
        author: {
          '@id': ORGANIZATION_ID
        },
        publisher: {
          '@id': ORGANIZATION_ID
        },
        datePublished: page.publishedTime,
        dateModified: page.modifiedTime,
        mainEntityOfPage: {
          '@id': webpageId
        }
      },
      breadcrumbNode
    ]
  }
}

export function AboutPageJsonLd({ frontmatter }: { frontmatter: unknown }) {
  const jsonLd = buildAboutPageJsonLd(frontmatter)

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
      }}
    />
  )
}
