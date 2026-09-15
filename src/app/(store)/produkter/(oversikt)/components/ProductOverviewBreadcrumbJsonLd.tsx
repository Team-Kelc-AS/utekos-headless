import { buildProductOverviewBreadcrumbJsonLd } from '../utils/buildProductOverviewBreadcrumbJsonLd'

export function ProductOverviewBreadcrumbJsonLd() {
  const jsonLd = buildProductOverviewBreadcrumbJsonLd()

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
      }}
    />
  )
}
