'use client'

import { useState } from 'react'
import Image from 'next/image'
import * as m from 'motion/react-m'
import { cn } from '@/lib/utils/className'
import { Steps } from './Steps'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { SkreddersyMotionProvider } from './SkreddersyMotionProvider'
import {
  revealGroup,
  revealItem,
  revealItemLeft,
  revealPop,
  revealScale,
  skreddersyEase,
  skreddersyViewport
} from './skreddersyMotionVariants'

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
      <article
        aria-labelledby='threeinone-heading'
        className='dark:bg-dark-background w-full bg-background text-foreground'
      >
        <m.div
          className='mx-auto max-w-4xl px-6 py-16 text-center md:py-24'
          initial='hidden'
          whileInView='visible'
          viewport={skreddersyViewport}
          variants={revealGroup}
        >
          <m.span
            className='mb-3 block font-utekos-text-medium text-base leading-4 tracking-wide text-ceramic'
            variants={revealItemLeft}
          >
            Adaptiv funksjonalitet
          </m.span>
          <m.h2
            id='threeinone-heading'
            className='font-google-sans mb-6 font-sans text-[clamp(2rem,7.5vw,4rem)] leading-[0.92] font-bold tracking-[-0.01em] text-foreground'
            variants={revealScale}
          >
            Friheten til å velge
          </m.h2>
          <m.p
            className='leading-text-paragraph /90 mx-auto max-w-2xl font-sans text-balance text-foreground/90'
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
        </m.div>

        <div className='flex flex-col pb-20 xl:hidden'>
          {Steps.map((step, index) => (
            <m.div
              key={step.id}
              className='mb-12 flex flex-col last:mb-0'
              initial='hidden'
              whileInView='visible'
              viewport={skreddersyViewport}
              variants={revealGroup}
              custom={index}
            >
              <m.div
                className='dark:border-dark-foreground/10 relative aspect-square w-full overflow-hidden border-y border-foreground/10 bg-card'
                variants={revealScale}
              >
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  loading='lazy'
                  quality={75}
                  className={cn(
                    step.desktopObjectFit === 'contain' ?
                      'object-contain p-12 min-[1536px]:p-16'
                    : 'object-cover'
                  )}
                  sizes='(max-width: 1279px) 100vw, 0px'
                />
                <BrandBadge
                  tone='promo'
                  className='absolute top-4 left-4 h-7 px-3 py-0 text-xs leading-none font-medium shadow-lg backdrop-blur-md'
                >
                  {step.stepNumber}
                </BrandBadge>
              </m.div>

              <div className='mx-auto w-full max-w-xl px-6 pt-6 md:px-8'>
                <m.div
                  className='dark:text-dark-primary mb-2 flex items-center gap-2 text-primary'
                  variants={revealItemLeft}
                >
                  <span className='inline-flex shrink-0'>
                    {step.icon}
                  </span>
                  <span className='text-sm leading-4 font-medium'>
                    {step.modeName}
                  </span>
                </m.div>
                <m.h3
                  className='font-google-sans mb-3 font-sans text-3xl leading-[0.92] font-bold tracking-[-0.01em] text-foreground md:text-4xl'
                  variants={revealItem}
                >
                  {step.title}
                </m.h3>
                <m.p
                  className='leading-text-paragraph /85 mt-2 font-sans tracking-wide text-foreground/85 md:text-2xl'
                  variants={revealItem}
                >
                  {step.description}
                </m.p>
              </div>
            </m.div>
          ))}
        </div>

        <div className='hidden w-full xl:flex'>
          <div className='dark:border-dark-foreground/10 sticky top-0 flex h-screen w-1/2 items-center justify-center overflow-hidden border-r border-foreground/10 bg-card'>
            {Steps.map((step, index) => (
              <m.div
                key={step.id}
                className={cn(
                  'absolute inset-0 flex size-full items-center justify-center p-6 min-[1536px]:p-10',
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
                    src={step.image}
                    alt={step.title}
                    fill
                    loading='lazy'
                    quality={75}
                    className={cn(
                      step.desktopObjectFit === 'contain' ?
                        'object-contain p-12 min-[1536px]:p-16'
                      : 'object-cover'
                    )}
                    sizes='(max-width: 1279px) 0px, min(43vw, 82vh)'
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

          <div className='dark:bg-dark-background flex w-1/2 flex-col bg-background'>
            {Steps.map((step, index) => (
              <m.div
                key={step.id}
                className='dark:border-dark-foreground/10 flex min-h-screen flex-col justify-center border-b border-foreground/10 px-20 last:border-0'
                initial='hidden'
                whileInView='visible'
                viewport={{
                  ...skreddersyViewport,
                  amount: 0.32
                }}
                variants={revealGroup}
                onViewportEnter={() => setActiveStep(index)}
              >
                <div>
                  <m.div
                    className='dark:text-dark-primary mb-4 flex items-center gap-3 font-sans text-base leading-4 font-medium text-primary md:text-lg'
                    variants={revealItemLeft}
                  >
                    <m.span
                      className='dark:text-dark-primary inline-flex shrink-0 text-primary'
                      variants={revealPop}
                    >
                      {step.icon}
                    </m.span>
                    <span className='font-utekos-text-medium text-base leading-4 md:text-lg'>
                      {step.stepNumber} — {step.modeName}
                    </span>
                  </m.div>

                  <m.h3
                    className='font-google-sans mb-6 font-sans text-5xl leading-[0.92] font-bold tracking-[-0.01em] text-foreground md:text-6xl'
                    variants={revealItem}
                  >
                    {step.title}
                  </m.h3>

                  <m.p
                    className='leading-text-paragraph /85 max-w-lg font-sans text-base text-foreground/85 md:text-2xl'
                    variants={revealItem}
                  >
                    {step.description}
                  </m.p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </article>
    </SkreddersyMotionProvider>
  )
}
