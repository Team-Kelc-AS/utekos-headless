'use client'

import { useQuery } from '@tanstack/react-query'
import { getFeaturedProductsAction } from '@/api/lib/products/actions'
import { getProductWithoutSmallSize } from '@/components/products/getProductWithoutSmallSize'
import { SharedProductCarousel } from './SharedProductCarousel'
import type { ShopifyProduct } from 'types/product'

async function getClientFeaturedProducts(): Promise<ShopifyProduct[]> {
  const products = await getFeaturedProductsAction()

  return products.map(getProductWithoutSmallSize)
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
