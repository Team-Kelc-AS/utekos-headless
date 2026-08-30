import { LazyFeaturedProductCarousel } from '@/components/ProductCard/LazyFeaturedProductCarousel'

export function TechMaterialsProductCarousel() {
  return (
    <section
      aria-label='Utvalgte produkter'
      className='container mx-auto px-4 pt-8 pb-8'
    >
      <LazyFeaturedProductCarousel />
    </section>
  )
}
