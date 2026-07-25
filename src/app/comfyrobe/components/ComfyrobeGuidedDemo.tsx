'use client'

import { useState } from 'react'
import Image from 'next/image'
import * as m from 'motion/react-m'
import {
  CloudRain,
  Move3d,
  ThermometerSnowflake
} from 'lucide-react'
import { cn } from '@/lib/utils/className'
import {
  comfyrobeEase,
  comfyrobeRevealGroup,
  comfyrobeRevealItem,
  comfyrobeRevealScale,
  comfyrobeViewport
} from './comfyrobeMotionVariants'

const demoSteps = [
  {
    number: '01',
    eyebrow: 'Regnet ute',
    title: 'Skjermet når været snur.',
    description:
      'HydroGuard™-skallet kombinerer 8 000 mm vannsøyle, tapede sømmer og en pustende membran for skiftende regn og vind.',
    image: '/comfy_rainy.webp',
    imageAlt: 'Person med mørk Comfyrobe ute i regnvær',
    imageClassName: 'object-cover object-center',
    icon: CloudRain
  },
  {
    number: '02',
    eyebrow: 'Varmen inne',
    title: 'Myk der du merker det.',
    description:
      'SherpaCore™ 250 GSM gir en lun innside som gjør kalde pauser, vindfulle turer og ventetid ute mer behagelig.',
    image: '/1080/comfy-design-1080.png',
    imageAlt: 'Nærbilde av SherpaCore-fôr og glidelås i Comfyrobe',
    imageClassName: 'object-cover object-center',
    icon: ThermometerSnowflake
  },
  {
    number: '03',
    eyebrow: 'Frihet i bevegelse',
    title: 'Romslig uten å holde deg igjen.',
    description:
      'Toveis YKK®-glidelås, splitter, lommer, justerbare mansjetter og en romslig unisex-passform gjør kåpen enkel å bruke gjennom dagen.',
    image: '/1080/comfy-open-1080.png',
    imageAlt: 'Åpen mørk Comfyrobe med synlig fôr',
    imageClassName: 'object-contain object-center p-8 md:p-12',
    icon: Move3d
  }
] as const

const stickyImageVariants = {
  active: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.72, ease: comfyrobeEase }
  },
  inactive: {
    opacity: 0,
    scale: 1.025,
    transition: { duration: 0.42, ease: comfyrobeEase }
  }
}

export function ComfyrobeGuidedDemo() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section
      id='section-product-demo'
      aria-labelledby='product-demo-heading'
      className='scroll-mt-20 bg-[#071f1e] text-white'
    >
      <m.div
        className='mx-auto max-w-4xl px-6 py-18 text-center md:px-12 md:py-24'
        initial='hidden'
        whileInView='visible'
        viewport={comfyrobeViewport}
        variants={comfyrobeRevealGroup}
      >
        <m.p
          className='font-utekos-text-medium text-sm tracking-wide text-[oklch(0.78_0.15_67)]'
          variants={comfyrobeRevealItem}
        >
          Bygget lag for lag
        </m.p>
        <m.h2
          id='product-demo-heading'
          className='mt-3 font-sans text-4xl leading-[0.94] font-bold tracking-[-0.025em] md:text-6xl'
          variants={comfyrobeRevealItem}
        >
          Beskyttelse utenpå. Ro inni.
        </m.h2>
        <m.p
          className='mx-auto mt-6 max-w-2xl font-utekos-text text-lg leading-relaxed text-white/75'
          variants={comfyrobeRevealItem}
        >
          Tre gjennomtenkte lag mellom deg og ruskeværet.
        </m.p>
      </m.div>

      <div className='pb-20 xl:motion-safe:hidden'>
        {demoSteps.map(step => {
          const Icon = step.icon

          return (
            <m.article
              key={step.number}
              className='mb-16 last:mb-0 xl:motion-reduce:grid xl:motion-reduce:grid-cols-2 xl:motion-reduce:items-center'
              initial='hidden'
              whileInView='visible'
              viewport={comfyrobeViewport}
              variants={comfyrobeRevealGroup}
            >
              <m.div
                className='relative aspect-4/5 overflow-hidden bg-[#d8d2ca] sm:aspect-square'
                variants={comfyrobeRevealScale}
              >
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  sizes='(max-width: 1279px) 100vw, 0px'
                  className={step.imageClassName}
                />
              </m.div>
              <div className='mx-auto max-w-2xl px-6 pt-7 md:px-12 xl:motion-reduce:pt-0 xl:motion-reduce:pr-16 xl:motion-reduce:pl-14'>
                <m.div
                  className='flex items-center gap-3 text-[oklch(0.78_0.15_67)]'
                  variants={comfyrobeRevealItem}
                >
                  <Icon className='size-5' aria-hidden />
                  <span className='font-utekos-text-medium text-sm tracking-wide'>
                    {step.number} · {step.eyebrow}
                  </span>
                </m.div>
                <m.h3
                  className='mt-3 font-sans text-3xl leading-[0.96] font-bold tracking-[-0.02em] md:text-4xl'
                  variants={comfyrobeRevealItem}
                >
                  {step.title}
                </m.h3>
                <m.p
                  className='mt-4 font-utekos-text text-base leading-7 text-white/74 md:text-lg'
                  variants={comfyrobeRevealItem}
                >
                  {step.description}
                </m.p>
              </div>
            </m.article>
          )
        })}
      </div>

      <div className='hidden min-h-[210vh] grid-cols-2 xl:motion-safe:grid'>
        <div className='sticky top-0 h-screen overflow-hidden border-r border-white/10 bg-[#d8d2ca]'>
          {demoSteps.map((step, index) => (
            <m.div
              key={step.number}
              aria-hidden
              className={cn(
                'absolute inset-0',
                activeStep === index ? 'z-10' : 'z-0'
              )}
              initial={index === 0 ? 'active' : 'inactive'}
              animate={activeStep === index ? 'active' : 'inactive'}
              variants={stickyImageVariants}
            >
              <Image
                src={step.image}
                alt=''
                fill
                sizes='50vw'
                className={step.imageClassName}
              />
            </m.div>
          ))}

          <div
            aria-hidden
            className='absolute right-8 bottom-8 left-8 z-20 flex items-center gap-3'
          >
            {demoSteps.map((step, index) => (
              <span
                key={step.number}
                className={cn(
                  'h-1.5 rounded-full transition-[width,background-color] duration-500 motion-reduce:transition-none',
                  activeStep === index ?
                    'w-12 bg-[#c99350]'
                  : 'w-3 bg-[#071f1e]/30'
                )}
              />
            ))}
          </div>
        </div>

        <div>
          {demoSteps.map((step, index) => {
            const Icon = step.icon

            return (
              <m.article
                key={step.number}
                className='flex min-h-[70vh] items-center border-b border-white/10 px-14 last:border-b-0 2xl:px-20'
                initial='hidden'
                whileInView='visible'
                viewport={{ once: true, amount: 0.42 }}
                variants={comfyrobeRevealGroup}
                onViewportEnter={() => setActiveStep(index)}
              >
                <div className='max-w-xl'>
                  <m.div
                    className='flex items-center gap-3 text-[oklch(0.78_0.15_67)]'
                    variants={comfyrobeRevealItem}
                  >
                    <Icon className='size-6' aria-hidden />
                    <span className='font-utekos-text-medium tracking-wide'>
                      {step.number} · {step.eyebrow}
                    </span>
                  </m.div>
                  <m.h3
                    className='mt-5 font-sans text-5xl leading-[0.92] font-bold tracking-[-0.025em] 2xl:text-6xl'
                    variants={comfyrobeRevealItem}
                  >
                    {step.title}
                  </m.h3>
                  <m.p
                    className='mt-6 font-utekos-text text-xl leading-relaxed text-white/72'
                    variants={comfyrobeRevealItem}
                  >
                    {step.description}
                  </m.p>
                </div>
              </m.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
