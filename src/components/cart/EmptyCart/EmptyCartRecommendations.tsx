import { useQuery } from '@tanstack/react-query'
import { RecommendedItem } from './RecommendedItem'
import type { ShopifyProduct } from 'types/product'
import { getRecommendedProducts } from '@/api/lib/products/getRecommendedProducts'

export function EmptyCartRecommendations() {
  const { data: products } = useQuery<ShopifyProduct[]>({
    queryKey: ['products', 'recommended'],
    queryFn: getRecommendedProducts
  })

  if (!products || products.length === 0) {
    return (
      <div className='text-center text-muted-foreground'>
        <p className='text-base text-foreground'>
          Handlekurven din er tom
        </p>
        <p className='mt-1 text-sm'>
          Legg til produkter for å komme i gang.
        </p>
      </div>
    )
  }

  return (
    <div className='text-left'>
      <h4 className='mb-4 font-utekos-text-medium text-base text-foreground'>
        Legg til for å starte din Utekos
      </h4>
      <div className='space-y-4'>
        {products.map(product => (
          <RecommendedItem
            key={product.id}
            product={product}
            totalItemCount={products.length}
          />
        ))}
      </div>
    </div>
  )
}
