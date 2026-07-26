// Path: src/components/ProductCard/PurchaseClientView.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import Fade from 'embla-carousel-fade'
import {
  Minus,
  Plus,
  Truck,
  RefreshCcw,
  Loader2,
  Gift,
  Ruler,
  Sparkles,
  Store,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils/className'
import { VippsLogo } from '@/components/payments/VippsLogo'
import { KlarnaLogo } from '@/components/payments/KlarnaLogo'
import { PostNordLogo } from '@/components/payments/PostNordLogo'
import { PRODUCT_VARIANTS } from '@/api/constants'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { CAROUSEL_SSR } from '@/components/ui/carousel-ssr'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Tabs,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import type { ModelKey } from '@/api/constants'
import type { PurchaseClientViewProps } from 'types/product/PageProps'

const SIZE_GUIDANCE: Record<
  string,
  { height: string; tips: string[] }
> = {
  'Liten': {
    height: 'Opptil 170 cm',
    tips: [
      'Er du lavere enn 165 cm får du en romslig og lun følelse.',
      'Er du litt høyere får du en nettere silhuett uten overflødig volum.'
    ]
  },
  'Middels': {
    height: '170 – 180 cm',
    tips: [
      'Er du lavere enn 170 cm får du en romslig passform.',
      'Ligger du i øvre sjiktet (mot 180 cm) får du en mer kroppsnær passform.'
    ]
  },
  'Stor': {
    height: '180 – 195 cm',
    tips: [
      'Perfekt for deg over 180 cm, eller for deg som er lavere og ønsker romslighet.',
      'Er du over 195 cm anbefaler vi heller størrelsen Ekstra stor.'
    ]
  },
  'Ekstra stor': {
    height: '190 cm og oppover',
    tips: [
      'Skreddersydd for deg over 190 cm – ekstra lengde i kroppen og ermene.',
      'Også et godt valg for deg som er lavere, men ønsker maksimal romslighet og lengde.'
    ]
  }
}

export function PurchaseClientView({
  selectedModel,
  setSelectedModel,
  quantity,
  setQuantity,
  selectedColorIndex,
  setSelectedColorIndex,
  selectedSize,
  setSelectedSize,
  handleAddToCart,
  handleGoToCheckout,
  isPending,
  currentConfig,
  isTechDownOffer
}: PurchaseClientViewProps) {
  const monthlyPrice = Math.round(currentConfig.price / 12)
  const guidance = SIZE_GUIDANCE[selectedSize]

  return (
    <article className='relative left-[calc(-50vw+50%)] w-screen overflow-clip text-foreground lg:flex lg:min-h-screen'>
      <div className='dark:bg-dark-background relative flex w-full flex-col items-center justify-center bg-background p-8 lg:sticky lg:top-0 lg:h-screen lg:w-1/2'>
        <div
          key={`badge-${selectedModel}`}
          className='animate-in dark:border-dark-background/10 dark:bg-dark-foreground/90 fade-in slide-in-from-left-2 absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-sm border border-background/10 bg-foreground/90 px-2.5 py-1 shadow-sm backdrop-blur-md duration-500'
        >
          <span className='relative flex h-1.5 w-1.5'>
            <span className='dark:bg-dark-accent absolute inline-flex size-full animate-ping rounded-full bg-accent *:opacity-60' />
            <span className='dark:bg-dark-accent relative inline-flex h-1.5 w-1.5 rounded-full bg-accent' />
          </span>
          <span className='dark:text-dark-background font-google-sans text-[10px] font-bold tracking-wider text-background uppercase'>
            {currentConfig.badge}
          </span>
        </div>
        <Carousel
          key={selectedModel}
          slideCount={currentConfig.images.length}
          ssr={CAROUSEL_SSR.fullWidth(
            currentConfig.images.length
          )}
          opts={{
            loop: currentConfig.images.length > 1,
            duration: 35
          }}
          plugins={
            currentConfig.images.length > 1 ? [Fade()] : []
          }
          className='relative w-full max-w-2xl'
        >
          <CarouselContent className='ml-0'>
            {currentConfig.images.map((src, i) => (
              <CarouselItem
                key={src}
                className='relative h-[50vh] pl-0 lg:h-[70vh]'
              >
                <div className='dark:ring-dark-background/10 relative size-full overflow-hidden rounded-3xl bg-linear-to-b from-white/70 to-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-background/10'>
                  <Image
                    src={src}
                    alt={`${currentConfig.title} – bilde ${i + 1}`}
                    fill
                    className='object-contain drop-shadow-2xl transition-transform duration-1200 ease-out hover:scale-[1.02]'
                    priority={i === 0}
                    sizes='(max-width: 1024px) 100vw, 50vw'
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {currentConfig.images.length > 1 && (
            <>
              <CarouselPrevious
                aria-label='Forrige bilde'
                className='dark:border-dark-background/15 dark:bg-dark-foreground/90 dark:text-dark-background dark:hover:bg-dark-foreground dark:hover:text-dark-accent left-2 size-10 border-background/15 bg-foreground/90 text-background shadow-md backdrop-blur-md hover:bg-foreground hover:text-accent md:size-11 *:md:left-4'
              />
              <CarouselNext
                aria-label='Neste bilde'
                className='dark:border-dark-background/15 dark:bg-dark-foreground/90 dark:text-dark-background dark:hover:bg-dark-foreground dark:hover:text-dark-accent right-2 size-10 border-background/15 bg-foreground/90 text-background shadow-md backdrop-blur-md hover:bg-foreground hover:text-accent md:size-11 *:md:right-4'
              />
            </>
          )}
        </Carousel>
        <p
          key={`caption-${selectedModel}`}
          className='animate-in dark:text-dark-background fade-in mt-8 hidden font-sans text-base text-background italic duration-700 lg:block'
        >
          Modell vist: {currentConfig.title}
        </p>
      </div>

      <div className='bg-foreground-muted flex w-full flex-col lg:h-screen lg:w-1/2'>
        <div className='flex-1 p-6 md:p-12 lg:overflow-y-auto lg:p-24'>
          <AnimatedBlock
            className='will-animate-fade-in-up mb-12'
            delay='0s'
            threshold={0.15}
          >
            <Tabs
              value={selectedModel}
              onValueChange={v =>
                setSelectedModel(v as ModelKey)
              }
              className='w-full md:w-fit'
            >
              <TabsList
                aria-label='Velg modell'
                className='dark:bg-dark-primary flex h-auto w-full flex-wrap gap-2 rounded-lg bg-primary p-1.5 md:w-fit'
              >
                {(
                  Object.keys(PRODUCT_VARIANTS) as ModelKey[]
                ).map(key => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className='dark:text-dark-background dark:hover:bg-dark-background/10 dark:data-active:!bg-dark-background dark:data-active:!text-dark-foreground dark:data-active:ring-dark-background/40 dark:text-dark-background dark:data-active:!bg-dark-background dark:data-active:!text-dark-foreground h-auto flex-1 rounded-md px-6 py-3 text-base font-medium whitespace-nowrap text-background transition-all duration-300 hover:scale-[1.02] hover:bg-background/10 md:flex-none data-active:!bg-background data-active:!text-foreground data-active:shadow-md data-active:ring-1 data-active:ring-background/40'
                  >
                    {PRODUCT_VARIANTS[key].title.replace(
                      'Utekos ',
                      ''
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </AnimatedBlock>

          <div key={`hero-${selectedModel}`} className='mb-12'>
            <AnimatedBlock
              className='will-animate-fade-in-up'
              delay='0.05s'
              threshold={0.15}
            >
              <h2 className='dark:text-dark-background mb-4 font-sans font-utekos-text-medium text-4xl leading-[1.1] text-background lg:text-7xl'>
                {currentConfig.title}
              </h2>
            </AnimatedBlock>
            <AnimatedBlock
              className='will-animate-fade-in-up'
              delay='0.1s'
              threshold={0.15}
            >
              <p className='dark:text-dark-background mb-8 text-xl font-light text-background'>
                {currentConfig.subtitle}
              </p>
            </AnimatedBlock>
            <AnimatedBlock
              className='will-animate-fade-in-up'
              delay='0.15s'
              threshold={0.15}
            >
              <div className='flex flex-wrap items-center gap-4 lg:gap-8'>
                <span className='dark:text-dark-background text-3xl font-medium text-background lg:text-4xl'>
                  {currentConfig.price},-
                </span>
                <div className='bg-klarna-pink flex items-center gap-2 rounded-sm px-4 py-2'>
                  <span className='dark:text-dark-background text-sm font-medium text-background'>
                    Eller {monthlyPrice},- /mnd
                  </span>
                  <KlarnaLogo className='dark:border-dark-background/30 h-6 w-fit rounded-sm border border-background/30 p-1' />
                </div>
              </div>
            </AnimatedBlock>
            {isTechDownOffer && (
              <AnimatedBlock
                className='will-animate-fade-in-up'
                delay='0.2s'
                threshold={0.15}
              >
                <div className='dark:border-dark-card/20 dark:from-dark-card/5 mt-8 flex items-center gap-4 rounded-lg border-2 border-card/20 bg-linear-to-br from-card/5 to-transparent p-4 shadow-sm'>
                  <div className='/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card/10'>
                    <Gift className='h-5 w-5 text-card' />
                  </div>
                  <div>
                    <h3 className='font-utekos-text-medium text-card'>
                      Sommertilbud
                    </h3>
                    <p className='text-sm text-card'>
                      10% rabatt + Gratis Buff™ (verdi 249,-)
                      legges til i kurven.
                    </p>
                  </div>
                </div>
              </AnimatedBlock>
            )}
          </div>

          <div
            key={`details-${selectedModel}`}
            className='mb-12 space-y-8'
            aria-label='Produktinformasjon'
          >
            <AnimatedBlock
              className='will-animate-fade-in-up'
              delay='0.05s'
              threshold={0.15}
            >
              <p className='leading-text-paragraph dark:text-dark-background/85 text-base text-background/85 md:text-lg'>
                {currentConfig.description}
              </p>
            </AnimatedBlock>

            <AnimatedBlock
              className='will-animate-fade-in-up'
              delay='0.1s'
              threshold={0.15}
            >
              <div className='dark:text-dark-background/75 -mx-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-background/75'>
                {currentConfig.features.map(feature => (
                  <span
                    key={feature}
                    className='inline-flex items-center gap-1.5 px-1 font-medium'
                  >
                    <span
                      aria-hidden
                      className='dark:bg-dark-accent h-1 w-1 shrink-0 rounded-full bg-accent'
                    />
                    <span className='whitespace-nowrap'>
                      {feature}
                    </span>
                  </span>
                ))}
              </div>
            </AnimatedBlock>

            <AnimatedBlock
              className='will-animate-fade-in-up'
              delay='0.15s'
              threshold={0.1}
            >
              <div className='bg-very-white dark:border-dark-background/10 rounded-md border border-background/10 px-4'>
                <div className='dark:border-dark-background/10 flex items-center justify-between border-b border-background/10 py-3'>
                  <span className='dark:text-dark-background/60 font-google-sans text-[11px] font-bold tracking-wider text-background/60 uppercase'>
                    Hva gjør{' '}
                    {currentConfig.title.replace('Utekos ', '')}{' '}
                    spesiell
                  </span>
                  <Sparkles
                    className='dark:text-dark-background size-4 text-background'
                    aria-hidden
                  />
                </div>
                <Accordion
                  key={`highlights-${selectedModel}`}
                  className='w-full'
                >
                  {currentConfig.highlights.map(highlight => (
                    <AccordionItem
                      key={highlight.title}
                      value={highlight.title}
                      className='dark:border-dark-background/10 border-b border-background/10 last:border-b-0'
                    >
                      <AccordionTrigger className='dark:text-dark-background dark:hover:text-dark-accent py-3 text-left font-utekos-text-medium text-sm text-background hover:text-accent hover:no-underline'>
                        {highlight.title}
                      </AccordionTrigger>
                      <AccordionContent className='leading-text-paragraph dark:text-dark-background/70 pt-0 pb-3 text-sm text-background/70'>
                        {highlight.body}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </AnimatedBlock>
          </div>

          <div className='mb-12 h-px w-full bg-card' />
          <div className='mb-12 space-y-12'>
            <div>
              <div className='mb-4 flex items-center justify-between'>
                <span className='dark:text-dark-background font-google-sans text-sm font-bold tracking-widest text-background'>
                  Størrelse
                </span>
                <Link
                  href={'/handlehjelp/storrelsesguide' as Route}
                  data-track='SizeGuideSkreddersyVarmen'
                  className='dark:text-dark-background dark:hover:text-dark-card text-sm text-background underline transition-colors hover:text-card'
                >
                  Se størrelsesguide
                </Link>
              </div>
              <div
                className={cn(
                  'grid gap-3 md:gap-4',
                  currentConfig.sizes.length === 4 ?
                    'grid-cols-4'
                  : currentConfig.sizes.length === 2 ?
                    'grid-cols-2'
                  : 'grid-cols-3'
                )}
              >
                {currentConfig.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      'group relative overflow-hidden rounded-sm border px-3 py-5 text-sm font-medium transition-all md:px-4 md:text-base',
                      selectedSize === size ?
                        'dark:border-dark-background dark:bg-dark-background border-background bg-background text-white shadow-lg'
                      : 'dark:border-dark-background/20 dark:bg-dark-foreground dark:text-dark-background dark:hover:border-dark-background border-background/20 bg-foreground text-background hover:border-background'
                    )}
                  >
                    {size}
                    {selectedSize === size && (
                      <div className='dark:bg-dark-primary absolute top-0 right-0 -mt-1.5 -mr-1.5 size-3 rotate-45 bg-primary' />
                    )}
                  </button>
                ))}
              </div>

              <div className='mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs'>
                <span className='dark:text-dark-background/55 tracking-wider text-background/55 uppercase'>
                  Farge
                </span>
                {currentConfig.colors.map((colorObj, index) => {
                  const isActive = selectedColorIndex === index
                  const isInteractive =
                    currentConfig.colors.length > 1
                  return (
                    <button
                      key={colorObj.name}
                      type='button'
                      onClick={() =>
                        isInteractive &&
                        setSelectedColorIndex(index)
                      }
                      aria-label={`Farge ${colorObj.name}`}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full transition',
                        isInteractive && 'hover:opacity-80',
                        !isInteractive && 'cursor-default'
                      )}
                    >
                      <span
                        className={cn(
                          'size-4 rounded-full border border-black/15',
                          isActive &&
                            isInteractive &&
                            'dark:ring-dark-primary ring-1 ring-primary ring-offset-1 ring-offset-white',
                          !isActive &&
                            isInteractive &&
                            'opacity-60'
                        )}
                        style={{ backgroundColor: colorObj.hex }}
                      />
                      {isActive && (
                        <span className='font-medium text-foreground'>
                          {colorObj.name}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {guidance && (
                <div
                  key={selectedSize}
                  className='animate-in fade-in slide-in-from-top-2 mt-6 duration-300'
                >
                  <div className='dark:bg-dark-background relative overflow-hidden rounded-md bg-background p-5'>
                    <div className='dark:border-dark-background mb-3 flex items-center gap-2 border-b border-background pb-3'>
                      <Ruler className='dark:text-dark-primary h-4 w-4 text-primary' />
                      <span className='font-google-sans text-sm font-bold tracking-wider text-foreground'>
                        Passer best for deg som er{' '}
                        {guidance.height}
                      </span>
                    </div>
                    <ul className='space-y-2'>
                      {guidance.tips.map((tip, i) => (
                        <li
                          key={i}
                          className='leading-text-paragraph flex items-start gap-2.5 text-sm text-foreground'
                        >
                          <div className='dark:bg-dark-primary mt-1.5 size-1 shrink-0 rounded-full bg-primary' />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='dark:border-dark-background/10 dark:bg-dark-foreground z-30 mx-auto border-t border-background/10 bg-foreground p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:p-12 lg:p-20'>
          <div className='mb-8 flex h-16 gap-4'>
            <div className='dark:border-dark-background/20 dark:bg-dark-foreground mx-auto flex h-full items-center rounded-sm border border-background/20 bg-foreground'>
              <button
                onClick={() =>
                  setQuantity(Math.max(1, quantity - 1))
                }
                className='dark:hover:bg-dark-background/5 flex h-full w-16 items-center justify-center transition-colors hover:bg-background/5'
                aria-label='Reduser antall'
              >
                <Minus size={20} />
              </button>
              <span className='w-14 text-center text-xl font-medium'>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className='dark:hover:bg-dark-background/5 flex h-full w-16 items-center justify-center transition-colors hover:bg-background/5'
                aria-label='Øk antall'
              >
                <Plus size={20} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              data-track='🔔🛒 AddToCartSkreddersyVarmen 🛒🔔'
              disabled={isPending}
              className={cn(
                'flex h-full flex-1 flex-row items-center justify-center gap-3 rounded-sm bg-commerce-primary px-2 text-commerce-primary-foreground shadow-xl transition-all hover:bg-commerce-primary-hover hover:text-commerce-primary-hover-foreground active:scale-[0.98] dark:bg-dark-commerce-primary dark:text-dark-commerce-primary-foreground dark:hover:bg-dark-commerce-primary-hover dark:hover:text-dark-commerce-primary-hover-foreground',
                isPending && 'cursor-not-allowed opacity-80'
              )}
            >
              {isPending ?
                <>
                  <Loader2 className='h-6 w-6 animate-spin' />
                  <span className='font-google-sans text-lg font-bold tracking-wider whitespace-nowrap'>
                    Legger til...
                  </span>
                </>
              : <>
                  <span className='font-google-sans text-lg font-bold tracking-wider whitespace-nowrap md:text-xl'>
                    Legg i kurv
                  </span>
                  <div className='hidden h-8 w-px bg-commerce-primary-foreground/40 md:block dark:bg-dark-commerce-primary-foreground/40' />
                  <span className='hidden text-xl font-normal whitespace-nowrap opacity-100 md:inline'>
                    {currentConfig.price * quantity},-
                  </span>
                </>
              }
            </button>
          </div>
          <div className='mb-8'>
            <button
              type='button'
              onClick={() => void handleGoToCheckout?.()}
              data-track='SkreddersyVarmenGoToCheckout'
              aria-label='Gå til kassen'
              disabled={isPending || !handleGoToCheckout}
              className={cn(
                'dark:border-dark-background/25 dark:bg-dark-background dark:text-dark-foreground dark:hover:bg-dark-background/90 font-google-sans flex h-14 w-full items-center justify-center gap-2 rounded-sm border border-background/25 bg-background px-4 text-base font-bold tracking-wider text-foreground shadow-md transition-all active:scale-[0.98]',
                (isPending || !handleGoToCheckout) &&
                  'cursor-not-allowed opacity-80'
              )}
            >
              {isPending ?
                <>
                  <Loader2 className='h-5 w-5 animate-spin' />
                  <span>Åpner kassen...</span>
                </>
              : <span>Gå til kassen</span>}
            </button>
          </div>
          <div className='flex flex-col gap-6'>
            <div className='flex items-center gap-8 md:gap-10'>
              <VippsLogo className='h-8 w-auto md:h-10' />
              <KlarnaLogo className='h-8 w-auto md:h-10' />
              <PostNordLogo className='mt-1 h-6 w-auto md:h-8' />
            </div>

            <AnimatedBlock
              className='will-animate-fade-in-up'
              delay='0s'
              threshold={0.1}
            >
              <div className='bg-very-white dark:border-dark-background/10 rounded-lg border border-background/10'>
                <div className='dark:divide-dark-background/10 grid grid-cols-1 divide-y divide-background/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
                  <div className='flex items-start gap-3 p-4'>
                    <Truck
                      size={22}
                      className='dark:text-dark-accent mt-0.5 shrink-0 text-accent'
                    />
                    <div className='min-w-0'>
                      <p className='dark:text-dark-background font-utekos-text-medium text-sm text-background'>
                        Rask levering 2–5 dager
                      </p>
                      <p className='dark:text-dark-background/65 mt-0.5 text-xs leading-snug text-background/65'>
                        Sendes samme dag (ikke søndag). Fri frakt
                        fra 999,-.
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3 p-4'>
                    <RefreshCcw
                      size={22}
                      className='dark:text-dark-accent mt-0.5 shrink-0 text-accent'
                    />
                    <div className='min-w-0'>
                      <p className='dark:text-dark-background font-utekos-text-medium text-sm text-background'>
                        14 dagers åpent kjøp
                      </p>
                      <p className='dark:text-dark-background/65 mt-0.5 text-xs leading-snug text-background/65'>
                        Send tilbake uten spørsmål.
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3 p-4'>
                    <Store
                      size={22}
                      className='dark:text-dark-accent mt-0.5 shrink-0 text-accent'
                    />
                    <div className='min-w-0'>
                      <p className='dark:text-dark-background font-utekos-text-medium text-sm text-background'>
                        På lager i Bergen
                      </p>
                      <p className='dark:text-dark-background/65 mt-0.5 text-xs leading-snug text-background/65'>
                        Også via Intersport. Norsk garanti.
                      </p>
                    </div>
                  </div>
                </div>
                <div className='dark:border-dark-background/10 border-t border-background/10 px-4 py-2.5'>
                  <Link
                    href={'/frakt-og-retur' as Route}
                    data-track='SkreddersyVarmenFraktOgReturLink'
                    className='group dark:text-dark-background/75 dark:hover:text-dark-accent inline-flex items-center gap-1.5 text-xs font-medium text-background/75 transition-colors hover:text-accent'
                  >
                    Alt om frakt og retur
                    <ArrowRight
                      size={12}
                      className='transition-transform group-hover:translate-x-0.5'
                    />
                  </Link>
                </div>
              </div>
            </AnimatedBlock>
          </div>
        </div>
      </div>
    </article>
  )
}
