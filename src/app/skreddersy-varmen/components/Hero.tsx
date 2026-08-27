
import type { ProductCommerceViewModel } from '@/lib/products/commerce'
import { HeroSection } from './HeroSection'

export function Hero({
  commerce
}: {
  commerce: ProductCommerceViewModel | null
}) {
  return (
   <article>
  <HeroSection commerce={commerce} />
    </article>
  )
} 