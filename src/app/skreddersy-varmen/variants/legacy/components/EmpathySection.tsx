// Path: src/app/skreddersy-varmen/components/EmpathySection.tsx
'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import * as m from 'motion/react-m'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { scrollToElement } from '@/lib/motion/scrollToElement'
import { reportLandingSelectPromotion } from '@/app/skreddersy-varmen/utils/reportLandingSelectPromotion'
import { SkreddersyMotionProvider } from '@/app/skreddersy-varmen/components/SkreddersyMotionProvider'
import {
  revealGroup,
  revealItem,
  revealItemLeft,
  revealItemRight,
  revealScale,
  scaleXReveal,
  scaleYReveal,
  skreddersyViewport
} from '@/app/skreddersy-varmen/components/skreddersyMotionVariants'

const HEADLINE = 'Når øyeblikket er for godt til å avsluttes.'

function scrollToModel() {
  reportLandingSelectPromotion('empathyCta')
  void scrollToElement('section-solution', { offsetY: 80 })
}

export function EmpathySection() {
  return (
    <SkreddersyMotionProvider>
      <m.section
        aria-labelledby='empathy-heading'
        className='relative w-full overflow-hidden bg-cloud-dancer py-16 text-background md:py-24 lg:py-28'
        initial='hidden'
        whileInView='visible'
        viewport={skreddersyViewport}
        variants={revealGroup}
      >
        <div className='mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 md:px-12 lg:grid-cols-2 lg:gap-16'>
          <div className='relative'>
            <m.div
              className='relative mb-4 inline-flex items-end overflow-hidden pb-1.5'
              variants={revealItemLeft}
            >
              <span className='font-sans text-sm leading-4 text-background'>
                Det du kjenner igjen
              </span>
              <m.span
                aria-hidden
                className='absolute bottom-0 left-0 h-px w-full origin-left bg-background'
                variants={scaleXReveal}
              />
            </m.div>
            <h2
              id='empathy-heading'
              className='mb-5 max-w-[11ch] font-utekos-text-medium text-4xl leading-[0.92] tracking-[-0.01em] text-background sm:text-4xl md:text-5xl'
            >
              <span className='block overflow-hidden pb-[0.08em]'>
                <m.span
                  className='inline-block'
                  variants={{
                    hidden: { y: '110%' },
                    visible: {
                      y: '0%',
                      transition: {
                        duration: 0.82,
                        ease: [0.16, 1, 0.3, 1]
                      }
                    }
                  }}
                >
                  {HEADLINE}
                </m.span>
              </span>
            </h2>

            <div className='leading-text-paragraph max-w-none text-base text-background'>
              <m.p
                className='relative max-w-136 font-sans'
                variants={revealItem}
              >
                Du kjenner følelsen. Praten går lett rundt
                bålpannen, flammene danser, og roen har senket
                seg. Så kommer den snikende trekken som truer med
                å bryte magien.
              </m.p>
              <div className='relative my-7 py-1.5'>
                <m.span
                  aria-hidden
                  className='absolute top-4 bottom-4 left-0 w-0.75 origin-top bg-primary'
                  variants={scaleYReveal}
                />
                <m.p
                  className='ml-5 font-sans text-xl leading-[0.95] font-bold tracking-normal text-background italic md:ml-7 md:text-3xl'
                  variants={revealItemRight}
                >
                  &ldquo;Det begynner å bli kaldt. <br />
                  Skal vi trekke inn?&rdquo;
                </m.p>
              </div>
              <m.p
                className='mt-6 max-w-136 font-utekos-text text-background'
                variants={revealItem}
              >
                Med Utekos® blir svaret enkelt. Tilpass passform,
                reguler ventilasjon og veksle mellom ulike
                funksjonelle moduser. Skreddersy varmen for å
                fortsette opplevelsen av kompromissløs komfort.
                Helt uavbrutt.
                <br />
                <br />
                <span className='font-medium text-background italic'>
                  Juster, form og nyt.
                </span>
              </m.p>
            </div>
            <m.div
              className='mt-8 md:mt-9'
              variants={revealItemLeft}
            >
              <BrandBadge
                asChild
                bgColor='var(--primary)'
                fgColor='var(--primary-foreground)'
                className='hover:bg-primary-hover h-12 px-5 py-0 font-utekos-text-medium text-sm leading-none tracking-normal shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-[0.98] md:h-14 md:px-6 md:text-base'
              >
                <button
                  type='button'
                  onClick={scrollToModel}
                  data-track='EmpathyCtaSkreddersyVarmen'
                  className='group inline-flex items-center gap-2 leading-none'
                >
                  <span className='block leading-none'>
                    Utforsk Utekos TechDown™
                  </span>
                  <span aria-hidden className='inline-flex'>
                    <ArrowRight className='size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0' />
                  </span>
                </button>
              </BrandBadge>
            </m.div>
          </div>

          <m.div
            className='relative w-full'
            variants={revealScale}
          >
            <div className='relative aspect-4/5 w-full md:aspect-square'>
              <div className='relative size-full overflow-hidden rounded-sm shadow-2xl shadow-background/20'>
                <div className='absolute inset-x-0 -inset-y-14'>
                  <Image
                    src='https://cdn.shopify.com/s/files/1/0634/2154/6744/files/skreddersdy-varmen-balpanne.jpg?v=1780812470'
                    alt='Bålpanne med flammer og to personer i mørkeblå Utekos TechDown™ i bakgrunnen.'
                    fill
                    className='object-cover'
                    sizes='(max-width: 1024px) 100vw, 50vw'
                    quality={85}
                  />
                </div>

                <div
                  aria-hidden
                  className='absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/90 via-black/45 to-transparent'
                />

                <m.div
                  className='absolute right-5 bottom-5 left-5 rounded-lg bg-black p-3 text-white shadow-lg md:right-7 md:bottom-7 md:left-7'
                  variants={revealItem}
                >
                  <p className='mb-1.5 text-sm leading-4 font-medium tracking-normal text-white/85'>
                    Stemning
                  </p>
                  <p className='font-sans text-lg leading-[0.95] font-bold tracking-normal italic drop-shadow-md md:text-2xl'>
                    &ldquo;Klokken er 23:15.
                    <br />
                    Ingen vil gå inn.&rdquo;
                  </p>
                </m.div>
              </div>

              <div
                aria-hidden
                className='absolute -right-6 -bottom-6 -z-10 hidden size-full rounded-sm border-2 border-background/10 md:block'
              />
            </div>
          </m.div>
        </div>
      </m.section>
    </SkreddersyMotionProvider>
  )
}
