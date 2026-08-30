'use client'

import { useState } from 'react'
import Image from 'next/image'
import * as m from 'motion/react-m'
import { cn } from '@/lib/utils/className'
import { Steps } from './Steps'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { SkreddersyMotionProvider } from '@/app/skreddersy-varmen/components/SkreddersyMotionProvider'
import {
  revealGroup,
  revealItem,
  revealItemLeft,
  revealPop,
  revealScale,
  skreddersyEase,
  skreddersyViewport
} from '@/app/skreddersy-varmen/components/skreddersyMotionVariants'

const stickyImageMotion = {
  active: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: skreddersyEase }
  },
  inactive: {
    opacity: 0,
    scale: 1.04,
    transition: { duration: 0.55, ease: skreddersyEase }
  }
}

export function SectionThreeInOne() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <SkreddersyMotionProvider>
      <section
        aria-labelledby='threeinone-heading'
        className='dark:bg-dark-background w-full bg-evening text-foreground'
      >
        <m.div
          className='mx-auto max-w-5xl px-6 py-16 text-left md:py-24'
          initial='hidden'
          whileInView='visible'
          viewport={skreddersyViewport}
          variants={revealGroup}
        >
          <m.span
            className='mb-3 block font-sans text-base leading-4 tracking-wide text-primary'
            variants={revealItemLeft}
          >
            Adaptiv funksjonalitet
          </m.span>
          <m.h2
            id='threeinone-heading'
            className='leading-heading-level-two mb-6 max-w-[18ch] font-sans text-4xl font-extrabold tracking-[-0.01em] text-balance text-foreground md:text-5xl lg:text-6xl'
            variants={revealScale}
          >
            Friheten til å velge
          </m.h2>
          <m.p
            className='leading-text-paragraph max-w-3xl font-sans text-foreground/90 md:text-lg'
            variants={revealItem}
          >
            Det unike med Utekos
            <span className='dark:text-dark-primary font-google-sans font-bold text-primary'>
              ®
            </span>{' '}
            er transformasjonen. Fra en isolerende kokong til en
            elegant parkas på sekunder. Du har en mobil
            varmekilde som endrer måten du behøver å planlegge
            på. Med Utekos er du helgradert.
          </m.p>
          <m.p
            className='mt-8 text-xs text-foreground/65'
            variants={revealItem}
          >
            Sist innholdsendret{' '}
            <time dateTime='2026-08-12'>12. august 2026</time>
          </m.p>
        </m.div>

        <div className='w-full lg:flex'>
          <div
            aria-hidden='true'
            className='dark:border-dark-foreground/10 sticky top-0 hidden h-screen w-1/2 items-center justify-center overflow-hidden rounded-r-lg border-r border-foreground/10 bg-jungle lg:flex'
          >
            {Steps.map((step, index) => (
              <m.div
                key={step.id}
                className={cn(
                  'absolute inset-0 flex size-full items-center justify-center rounded-r-lg bg-jungle p-6 min-[1536px]:p-10',
                  activeStep === index ? 'z-10' : 'z-0'
                )}
                animate={
                  activeStep === index ? 'active' : 'inactive'
                }
                initial={index === 0 ? 'active' : 'inactive'}
                variants={stickyImageMotion}
              >
                <div className='dark:border-dark-foreground/15 dark:bg-dark-background/40 relative aspect-square w-[min(86%,82vh)] overflow-hidden rounded-3xl border border-foreground/15 bg-background/40 shadow-2xl'>
                  <Image
                    src={step.image.desktop}
                    alt=''
                    fill
                    loading='lazy'
                    quality={75}
                    className={cn(
                      step.desktopObjectFit === 'contain' ?
                        'object-contain p-12 min-[1536px]:p-16'
                      : 'object-cover'
                    )}
                    sizes='(max-width: 1023px) 0px, min(43vw, 82vh)'
                  />
                  <div className='dark:from-dark-background absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-background to-transparent opacity-60' />
                </div>
              </m.div>
            ))}

            <div className='absolute bottom-8 left-8 z-20 flex gap-3'>
              {Steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none',
                    activeStep === i ?
                      'dark:bg-dark-accent w-8 bg-accent shadow-[0_0_8px_var(--color-accent)]'
                    : 'dark:bg-dark-foreground/30 w-2 bg-foreground/30'
                  )}
                />
              ))}
            </div>
          </div>

          <div className='dark:bg-dark-background flex w-full flex-col bg-evening pb-20 lg:w-1/2 lg:pb-0'>
            {Steps.map((step, index) => (
              <m.div
                key={step.id}
                className='dark:border-dark-foreground/10 mb-12 flex flex-col border-foreground/10 bg-evening last:mb-0 lg:mb-0 lg:min-h-screen lg:justify-center lg:border-b lg:px-12 lg:py-24 lg:last:border-0 xl:px-20'
                initial='hidden'
                whileInView='visible'
                viewport={{
                  ...skreddersyViewport,
                  amount: 0.32
                }}
                variants={revealGroup}
                onViewportEnter={() => setActiveStep(index)}
              >
                <m.div
                  className={cn(
                    'dark:border-dark-foreground/10 relative w-full overflow-hidden border-y border-foreground/10 bg-jungle lg:hidden',
                    step.mobileAspectClassName
                  )}
                  variants={revealScale}
                >
                  <Image
                    src={step.image.mobile}
                    alt={step.imageAlt}
                    fill
                    loading='lazy'
                    quality={75}
                    className={cn(
                      step.desktopObjectFit === 'contain' ?
                        'bg-jungle object-contain p-12'
                      : 'object-cover'
                    )}
                    sizes='(max-width: 1023px) 100vw, 0px'
                  />
                  <BrandBadge
                    tone='promo'
                    className='absolute top-4 left-4 h-7 px-3 py-0 text-xs leading-none font-medium shadow-lg backdrop-blur-md'
                  >
                    {step.stepNumber}
                  </BrandBadge>
                </m.div>

                <div className='mx-auto w-full max-w-xl px-6 pt-6 md:px-8 lg:px-0 lg:pt-0'>
                  <m.div
                    className='dark:text-dark-primary mb-2 flex items-center gap-2 font-sans text-primary lg:mb-4 lg:gap-3'
                    variants={revealItemLeft}
                  >
                    <m.span
                      className='dark:text-dark-primary inline-flex shrink-0 text-primary'
                      variants={revealPop}
                    >
                      {step.icon}
                    </m.span>
                    <span className='font-utekos-text-medium text-sm leading-4 font-medium lg:text-base xl:text-lg'>
                      <span className='hidden lg:inline'>
                        {step.stepNumber} —{' '}
                      </span>
                      {step.modeName}
                    </span>
                  </m.div>

                  <m.h3
                    className='mb-3 font-sans text-3xl leading-[0.92] font-extrabold tracking-[-0.01em] text-foreground md:text-4xl lg:mb-6 lg:text-5xl xl:text-6xl'
                    variants={revealItem}
                  >
                    {step.title}
                  </m.h3>

                  <m.p
                    className='leading-text-paragraph mt-2 max-w-lg font-sans text-base tracking-wide text-foreground/85 md:text-2xl lg:mt-0 lg:tracking-normal'
                    variants={revealItem}
                  >
                    {step.description}
                  </m.p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>
    </SkreddersyMotionProvider>
  )
}
