import { KlarnaHomePagePromotionBox } from '@/components/klarna/components/KlarnaHomePagePromotionBox'

export function LandingKlarnaPromotion() {
  return (
    <section
      aria-label='Betalingsinformasjon fra Klarna'
      className='w-full bg-background px-6 py-16 md:px-12 md:py-24'
    >
      <div className='mx-auto flex w-full max-w-5xl justify-center'>
        <KlarnaHomePagePromotionBox />
      </div>
    </section>
  )
}
