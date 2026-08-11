import { getProductPresentation } from '@/lib/products/presentation'
import { JsonLdScript } from '@/lib/seo/jsonLd/JsonLdScript'

const SITE_URL = 'https://utekos.no'

export async function ProductBreadcrumbJsonLd({
  handle
}: {
  handle: string
}) {
  const presentation = getProductPresentation(handle)

  if (!presentation) return null

  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': `${presentation.canonicalUrl}#breadcrumb`,
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
            'name': presentation.displayName,
            'item': presentation.canonicalUrl
          }
        ]
      }}
    />
  )
}
