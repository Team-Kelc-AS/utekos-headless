import { KlarnaTopStripPromotionAutoSize } from '@/components/klarna/components/KlarnaTopStripPromotionAutoSize'

export function SkreddersyVarmenKlarnaStrip() {
  return (
    <aside
      aria-label='Klarna betalingsinformasjon'
      className='klarna-top-strip w-full overflow-hidden bg-background'
    >
      <KlarnaTopStripPromotionAutoSize />
    </aside>
  )
}
