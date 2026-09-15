import { cacheLife, cacheTag } from 'next/cache'
import { buildProductListJsonLd } from '../utils/buildProductListJsonLd'

export async function ProductListJsonLd() {
  'use cache'

  cacheLife('max')
  cacheTag('product-list', 'products')

  const jsonLd = await buildProductListJsonLd()

  if (!jsonLd) {
    return null
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
