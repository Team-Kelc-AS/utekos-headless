import { ComparisonTeaser } from '@/app/handlehjelp/sammenlign-modeller/components/ComparisonTeaser'
import { HelpChooseSection } from './components/HelpChooseSection'
import { ProductsPageFooter } from '@/app/produkter/(oversikt)/components/ProductsPageFooter'
import { ProductsPageHeader } from '@/app/produkter/(oversikt)/components/ProductsPageHeader'
import { LazyFeaturedProductCarousel } from '@/components/ProductCard/LazyFeaturedProductCarousel'
import { ComfyrobeFeatureSection } from './components/ComfyrobeFeatureSection'
import { VideoSkeleton } from './components/VideoSkeleton'
import { Suspense } from 'react'
import { StapperFeatureSection } from './components/StapperFeatureSection/StapperFeatureSection'
import { ProductVideoSection } from './components/Video/ProductVideoSection'
import { LazyTechDownFeatureSection } from './components/LazyTechDownFeatureSection'
import { MikrofiberSection } from './components/MicrofiberSection/MikrofiberSection'

const ProductsPage = async () => {
  return (
    <>
      <article className='container mx-auto px-4 pt-0 pb-16 sm:pb-24'>
        <ProductsPageHeader />
        <HelpChooseSection />

        <Suspense fallback={<VideoSkeleton />}>
          <ProductVideoSection />
        </Suspense>

        <LazyTechDownFeatureSection />

        <ComparisonTeaser />

        <article className='mb-24'>
          <LazyFeaturedProductCarousel />
        </article>

        <ComfyrobeFeatureSection />

        <MikrofiberSection />

        <StapperFeatureSection />

        <ProductsPageFooter />
      </article>
    </>
  )
}

export default ProductsPage
