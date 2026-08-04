import 'server-only'

import type { ItemList, ListItem, WithContext } from 'schema-dts'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import { fetchProductsWithRetry } from './fetchProductsWithRetry'

export async function buildProductListJsonLd(): Promise<WithContext<ItemList> | null> {
  try {
    const products = await fetchProductsWithRetry()

    if (!products || products.length === 0) {
      console.warn('ProductListJsonLd: No products found after retries.')
      return null
    }

    const itemListElement: ListItem[] = products.slice(0, 12).map((product, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'url': `https://utekos.no/produkter/${product.handle}`,
      'name': product.title,
      ...(product.featuredImage?.url ?
        { image: resolveImageSrc(product.featuredImage.url) }
      : {})
    }))

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Alle produkter fra Utekos',
      'description': 'Skreddersy varmen',
      'url': 'https://utekos.no/produkter',
      'itemListElement': itemListElement
    }
  } catch (error) {
    console.error('Non-critical error: ProductListJsonLd skipped due to fetch failure:', error)

    return null
  }
}
