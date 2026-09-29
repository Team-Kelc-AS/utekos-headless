'use client'

import { useQuery } from '@tanstack/react-query'
import { RecommendedItem } from './RecommendedItem'
import { EmptyCartComfyrobeKlarnaDeal } from './EmptyCartComfyrobeKlarnaDeal'
import { recommendedProductsOptions } from '@/api/lib/products/cartSuggestionOptions'

export function EmptyCartRecommendations() {
  const { data: products } = useQuery(recommendedProductsOptions)
  const otherProducts = products?.filter(
    product => product.handle !== 'comfyrobe'
  )

  return (
    <div className='w-full max-w-md text-left'>
      <EmptyCartComfyrobeKlarnaDeal />

      {!otherProducts || otherProducts.length === 0 ?
        <div className='text-center text-muted-foreground'>
          <p className='text-base text-foreground'>
            Handlekurven din er tom
          </p>
          <p className='mt-1 text-sm'>
            Legg til produkter for å komme i gang.
          </p>
        </div>
      : <>
          <h4 className='mb-4 font-sans font-semibold text-base text-foreground'>
            Legg til for å starte din Utekos
          </h4>
          <div className='space-y-4'>
            {otherProducts.map(product => (
              <RecommendedItem
                key={product.id}
                product={product}
                totalItemCount={otherProducts.length}
              />
            ))}
          </div>
        </>
      }
    </div>
  )
}
