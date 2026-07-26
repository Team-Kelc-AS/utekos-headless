'use client'

import { useQuery } from '@tanstack/react-query'
import { getProductsAction } from '@/api/lib/products/actions'
import { handles as featuredProductHandles } from '@/db/data/products/product-info'
import { getProductWithoutSmallSize } from '@/components/products/getProductWithoutSmallSize'
import { SharedProductCarousel } from './SharedProductCarousel'
import type { ShopifyProduct } from 'types/product'

async function getClientFeaturedProducts(): Promise<ShopifyProduct[]> {
  const response = await getProductsAction()

  if (!response.success || !response.body || response.body.length === 0) {
    return []
  }

  const productsByHandle = new Map(response.body.map(product => [product.handle, product]))

  return featuredProductHandles
    .map(handle => productsByHandle.get(handle))
    .filter((product): product is ShopifyProduct => Boolean(product))
    .map(getProductWithoutSmallSize)
}

export function FeaturedProductCarousel() {
  const { data: products } = useQuery({
    queryKey: ['products', 'featured', 'visible'],
    queryFn: getClientFeaturedProducts
  })

  if (!products || products.length === 0) {
    return null
  }

  return (
    <SharedProductCarousel
      products={products}
      itemListId='featured_products'
      itemListName='Utvalgte produkter'
    />
  )
}
