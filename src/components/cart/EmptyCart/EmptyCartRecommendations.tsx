import { useQuery } from '@tanstack/react-query'
import { RecommendedItem } from './RecommendedItem'
import { recommendedProductsOptions } from '@/api/lib/products/cartSuggestionOptions'
import { KlarnaCreditPromotionAutoSize } from '@/components/klarna/components/KlarnaCreditPromotionAutoSize'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'

export function EmptyCartRecommendations() {
  const { data: products } = useQuery(recommendedProductsOptions)

  return (
    <div className='w-full max-w-md text-left'>
      <div className='mb-5 rounded-xl bg-muted/40 px-4 py-3'>
        <p className='font-sans text-sm text-foreground'>
          Handlekurven er tom — se hvordan Klarna kan gjøre
          neste kjøp enklere.
        </p>
        <div
          className='mt-2 min-h-10'
          role='group'
          aria-label='Klarna-tilbud for tom handlekurv'
        >
          <KlarnaOnSiteMessagingScript strategy='lazyOnload' />
          <KlarnaCreditPromotionAutoSize
            id='klarna-credit-promotion-empty-cart'
            theme='default'
          />
        </div>
      </div>

      {!products || products.length === 0 ?
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
            {products.map(product => (
              <RecommendedItem
                key={product.id}
                product={product}
                totalItemCount={products.length}
              />
            ))}
          </div>
        </>
      }
    </div>
  )
}
