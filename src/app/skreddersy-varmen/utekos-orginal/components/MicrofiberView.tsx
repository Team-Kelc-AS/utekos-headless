import {
  Check,
  Truck,
  ShieldCheck,
  ShoppingCart,
  Loader2,
  Zap
} from 'lucide-react'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { productConfig } from '@/app/skreddersy-varmen/utekos-orginal/utils/productConfig'
import { KlarnaLandingExpressCheckout } from '@/app/skreddersy-varmen/components/KlarnaLandingExpressCheckout'
import { MicrofiberPurchaseImageCarousel } from './MicrofiberPurchaseImageCarousel'
import type {
  MicrofiberLogicProps,
  MicrofiberColor,
  MicrofiberSize
} from 'types/product/'

export function MicrofiberView({
  color,
  setColor,
  size,
  setSize,
  product,
  selectedVariant,
  handleAddToCart,
  scrollToSizeGuide,
  isPending
}: MicrofiberLogicProps) {
  return (
    <article className='w-full border-t border-[#2C2420]/5 bg-jungle py-16 text-[#2C2420] md:py-24'>
      <div className='mx-auto max-w-6xl px-6'>
        <div className='grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-24'>
          <AnimatedBlock className='relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-[#2C2420]/5 bg-[#E5E2DB] shadow-lg'>
            <MicrofiberPurchaseImageCarousel />
            <div className='pointer-events-none absolute top-4 left-4 z-20 rounded-full bg-primary px-3 py-1.5 font-google-sans text-xs font-bold tracking-wider text-foreground uppercase shadow-sm'>
              Original
            </div>
          </AnimatedBlock>

          <div className='flex h-full flex-col justify-center'>
            <AnimatedBlock delay='0.1s'>
              <h2 className='mb-4 font-sans text-3xl font-extrabold text-foreground md:text-5xl'>
                Sikre deg varmen nå.
              </h2>
              <p className='mb-8 font-utekos-text text-lg leading-relaxed text-foreground'>
                Invester i kvalitetstid. Utekos Mikrofiber™ er
                laget for å vare, sesong etter sesong.
              </p>
              <div className='mb-8 flex items-baseline gap-3 border-b border-[#2C2420]/10 pb-6'>
                <span className='font-google-sans text-3xl font-bold text-foreground'>
                  {productConfig.price},-
                </span>
                <span className='text-sm text-foreground/70'>
                  Inkl. mva og fri frakt
                </span>
              </div>

              <div className='mb-8'>
                <label className='mb-3 block font-google-sans text-sm font-bold tracking-wider text-foreground uppercase'>
                  Velg Farge:{' '}
                  <span className='ml-1 text-foreground'>
                    {
                      productConfig.colors.find(
                        c => c.id === color
                      )?.name
                    }
                  </span>
                </label>
                <div className='flex gap-4'>
                  {productConfig.colors.map(c => (
                    <button
                      key={c.id}
                      // FIX: Caster string ID til streng type MicrofiberColor
                      onClick={() =>
                        setColor(c.id as MicrofiberColor)
                      }
                      className={`group relative h-14 w-14 rounded-full border-2 transition-all duration-200 md:h-16 md:w-16 ${color === c.id ? 'scale-110 border-[#2C2420] ring-2 ring-[#2C2420]/25' : 'border-transparent hover:scale-105'} `}
                      aria-label={`Velg farge ${c.name}`}
                    >
                      <span
                        className='absolute inset-1 rounded-full border border-black/10'
                        style={{ backgroundColor: c.hex }}
                      />
                      {color === c.id && (
                        <span className='absolute inset-0 flex items-center justify-center text-white drop-shadow-md'>
                          <Check size={20} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className='mb-10'>
                <div className='mb-3 flex items-center justify-between'>
                  <label className='block font-google-sans text-sm font-bold tracking-wider text-foreground uppercase'>
                    Velg Størrelse
                  </label>
                  <button
                    onClick={scrollToSizeGuide}
                    aria-label='Usikker på størrelsen?'
                    data-track='SizeGuideScrollClick'
                    className='text-xs text-[#2C2420]/60 underline transition-colors hover:text-[#E07A5F] md:text-sm'
                  >
                    Usikker på størrelsen?
                  </button>
                </div>

                <div className='grid grid-cols-2 gap-3 md:gap-4'>
                  {productConfig.sizes.map(s => (
                    <button
                      key={s.id}
                      // FIX: Caster string ID til streng type MicrofiberSize
                      onClick={() =>
                        setSize(s.id as MicrofiberSize)
                      }
                      className={`relative rounded-xl border-none bg-dark-teal p-3 text-left transition-all duration-200 md:p-4 ${
                        size === s.id ? 'ring-2 ring-foreground' : ''
                      }`}
                    >
                      <span className='mb-1 block font-sans text-base font-bold text-foreground md:text-lg'>
                        {s.name}
                      </span>
                      <span className='block text-xs leading-tight text-foreground/90'>
                        {s.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <BrandBadge
                asChild
                tone='commerce-primary'
                className='bg-primary text-foreground hover:-translate-y-1 hover:bg-primary-hover hover:text-foreground hover:shadow-2xl active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-70 dark:bg-primary dark:text-foreground dark:hover:bg-primary-hover dark:hover:text-foreground'
              >
                <button
                  onClick={handleAddToCart}
                  data-track='❗🛒❗SkreddersyUtekosOrginalAddToCartClick ❗🛒❗'
                  disabled={isPending}
                  className='font-google-sans flex w-full items-center justify-center gap-3 py-4 text-lg font-bold shadow-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:py-5'
                >
                  {isPending ?
                    <>
                      <Loader2 className='animate-spin' /> Legger
                      til...
                    </>
                  : <>
                      <ShoppingCart size={20} /> Legg i handlekurv
                      — {productConfig.price},-
                    </>
                  }
                </button>
              </BrandBadge>

              <KlarnaLandingExpressCheckout
                product={product}
                selectedVariant={selectedVariant}
                quantity={1}
                className='mt-4'
              />

              <div className='mt-6 grid grid-cols-3 gap-2 text-xs text-foreground md:mt-8 md:gap-4 md:text-sm'>
                <div className='flex items-center gap-2'>
                  <Truck size={16} className='shrink-0 text-[#E07A5F]' />
                  <span>Gratis frakt</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Zap size={16} className='shrink-0 text-[#E07A5F]' />
                  <span>Rask levering</span>
                </div>
                <div className='flex items-center gap-2'>
                  <ShieldCheck
                    size={16}
                    className='shrink-0 text-[#E07A5F]'
                  />
                  <span>14 dagers åpent kjøp</span>
                </div>
              </div>
            </AnimatedBlock>
          </div>
        </div>
      </div>
    </article>
  )
}
