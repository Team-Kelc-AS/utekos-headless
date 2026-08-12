import { Suspense } from 'react'
import {
  LazyNewProductInStoreNotice,
  LazyChatAndInfoSection,
  LazyTestimonialConstellation
} from '@/components/frontpage/lazy/LazyHeavyClients'

import { HeroSection } from '@/components/frontpage/components/HeroSection/HeroSection'
import { HomePageSectionFlow } from '@/components/frontpage/layout/HomePageSectionFlow'
import { MomentsSection } from '@/components/frontpage/MomentSection/MomentsSection'
import { CachedPromiseSection } from '@/components/frontpage/components/CachedPromiseSection'
import { QualitySection } from '@/components/frontpage/QualitySection'
import { NodeSection } from '@/components/frontpage/NodeSection/NodeSection'
import { ComfyrobeSection } from '@/components/frontpage/components/SpecialOfferSection/ComfyrobeSection'
import { FeaturedProductsSkeleton } from '@/components/skeletons/FeaturedProductsSkeleton'
import { AsyncProductLaunchWrapper } from '@/components/frontpage/AsyncProductLaunchWrapper'
import { FeaturedProductsSection } from '@/components/frontpage/FeaturedProductSection'
import { FrontPageJsonLd } from '@/components/frontpage/components/FrontPageJsonLd/FrontPageJsonLd'

const HomePage = () => {
  return (
    <>
      <FrontPageJsonLd />
      <article>
        <HeroSection />
        <HomePageSectionFlow>
          <div className='flex flex-col'>
            <Suspense fallback={null}>
              <AsyncProductLaunchWrapper />
            </Suspense>
            <LazyNewProductInStoreNotice />
            <Suspense fallback={<FeaturedProductsSkeleton />}>
              <FeaturedProductsSection />
            </Suspense>
            <NodeSection />
            <ComfyrobeSection />
            <LazyChatAndInfoSection />
          </div>
          <div className='flex flex-col'>
            <CachedPromiseSection />
            <MomentsSection />
            <QualitySection />
          </div>
        </HomePageSectionFlow>
        <LazyTestimonialConstellation />
      </article>
    </>
  )
}

export default HomePage
