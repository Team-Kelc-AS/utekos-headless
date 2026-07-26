// Path: src/app/inspirasjon/isbading/sections/CTASection.tsx

import { getProducts } from '@/api/lib/products/getProducts'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { ComfyrobeQuickBuy } from './ComfyrobeQuickBuy'

export async function CTASection() {
  const response = await getProducts({
    query: 'handle:comfyrobe'
  })
  const product =
    response.body?.find(p => p.handle === 'comfyrobe') ??
    response.body?.find(
      p =>
        p.title.toLowerCase().includes('comfyrobe') &&
        !p.title.toLowerCase().includes('dun')
    ) ??
    response.body?.[0]

  if (!product) {
    return null
  }

  return (
    <article className='dark:bg-dark-background relative overflow-hidden border-t border-foreground/12 bg-background py-24'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,var(--ancient-water)_0%,transparent_34%),radial-gradient(circle_at_85%_10%,var(--soft-warm)_0%,transparent_28%)] opacity-[0.18]' />

      <div className='relative container mx-auto px-4'>
        <AnimatedBlock className='will-animate-fade-in-scale mb-12 text-center'>
          <h2 className='text-fluid-display font-google-sans mb-4 leading-[0.95] font-bold tracking-normal text-foreground'>
            Sikre deg varmen nå
          </h2>
          <p className='leading-text-paragraph mx-auto max-w-2xl text-xl tracking-normal text-ancient-water'>
            Gjør som hundrevis av andre isbadere. Bestill din
            Comfyrobe i dag og kjenn forskjellen.
          </p>
        </AnimatedBlock>

        <AnimatedBlock
          className='will-animate-fade-in-up'
          delay='0.2s'
        >
          <div className='dark:bg-dark-background mx-auto max-w-6xl rounded-3xl border border-foreground/12 bg-background p-6 shadow-2xl md:p-12'>
            <ComfyrobeQuickBuy product={product} />
          </div>
        </AnimatedBlock>
      </div>
    </article>
  )
}
