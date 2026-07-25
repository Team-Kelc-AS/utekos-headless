'use client'

import * as m from 'motion/react-m'
import {
  CloudRain,
  ShieldCheck,
  ThermometerSnowflake,
  Wind
} from 'lucide-react'
import {
  comfyrobeRevealGroup,
  comfyrobeRevealItem,
  comfyrobeViewport
} from './comfyrobeMotionVariants'

const productProof = [
  {
    icon: CloudRain,
    label: '8 000 mm vannsøyle',
    detail: 'Beskytter når regnet varer.'
  },
  {
    icon: ShieldCheck,
    label: 'Tapede sømmer',
    detail: 'Forsterker værbeskyttelsen.'
  },
  {
    icon: Wind,
    label: 'Pustende membran',
    detail: 'Slipper ut overskuddsvarme.'
  },
  {
    icon: ThermometerSnowflake,
    label: 'SherpaCore™ 250 GSM',
    detail: 'Gir en myk og lun innside.'
  }
] as const

export function ComfyrobeProofBridge() {
  return (
    <section
      aria-labelledby='proof-bridge-heading'
      className='bg-background py-18 text-foreground md:py-24'
    >
      <m.div
        className='mx-auto max-w-7xl px-6 md:px-12'
        initial='hidden'
        whileInView='visible'
        viewport={comfyrobeViewport}
        variants={comfyrobeRevealGroup}
      >
        <m.div
          className='grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end'
          variants={comfyrobeRevealItem}
        >
          <div>
            <p className='font-utekos-text-medium text-sm tracking-wide text-primary dark:text-[oklch(0.78_0.15_67)]'>
              Fra hverdagsregn til kalde pauser
            </p>
            <h2
              id='proof-bridge-heading'
              className='mt-3 max-w-[12ch] font-sans text-4xl leading-[0.94] font-bold tracking-[-0.025em] md:text-6xl'
            >
              Når været skifter, trenger du bare ett lag.
            </h2>
          </div>
          <p className='max-w-2xl font-utekos-text text-lg leading-relaxed text-foreground/80 lg:justify-self-end'>
            Fra hundeturen til sidelinjen, hytta og raske ærender:
            Comfyrobe™ samler værbeskyttelse og varme i én romslig
            allværskåpe.
          </p>
        </m.div>

        <m.dl
          className='mt-12 grid border-y border-border sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border'
          variants={comfyrobeRevealGroup}
        >
          {productProof.map(item => {
            const Icon = item.icon

            return (
              <m.div
                key={item.label}
                className='border-b border-border py-6 last:border-b-0 sm:[&:nth-child(3)]:border-b-0 lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:pr-0'
                variants={comfyrobeRevealItem}
              >
                <dt className='flex items-center gap-3 font-utekos-text-medium font-bold'>
                  <Icon
                    className='size-5 shrink-0 text-primary dark:text-[oklch(0.78_0.15_67)]'
                    aria-hidden
                  />
                  {item.label}
                </dt>
                <dd className='mt-2 pl-8 text-sm leading-6 text-foreground/70'>
                  {item.detail}
                </dd>
              </m.div>
            )
          })}
        </m.dl>
      </m.div>
    </section>
  )
}
