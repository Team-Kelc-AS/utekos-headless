// Path: src/components/ProductCard/AllProductsCarousel.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { getProductsAction } from '@/api/lib/products/actions'
import { SharedProductCarousel } from './SharedProductCarousel'

export function AllProductsCarousel() {
  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const response = await getProductsAction()
      if (!response.success || !response.body) {
        return []
      }
      return response.body
    }
  })

  const sortedProducts =
    !products ?
      []
    : [...products].sort((a, b) => {
        if (a.handle === 'utekos-mikrofiber') return -1
        if (b.handle === 'utekos-mikrofiber') return 1
        return 0
      })

  if (sortedProducts.length === 0) {
    return null
  }

  return (
    <SharedProductCarousel
      products={sortedProducts}
      itemListId='all_products'
      itemListName='Alle produkter'
    />
  )
}
