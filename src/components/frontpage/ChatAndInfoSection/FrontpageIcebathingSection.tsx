'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import {
  ArrowRight,
  Droplets,
  Thermometer,
  Wind,
  AlertCircle
} from 'lucide-react'
import type { Route } from 'next'
import { animate, inView, stagger } from 'motion'
import ComfyrobeOriginal from '@public/comfyrobe-full.webp'

export function FrontpageIceBathingSection() {
  const container = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = container.current
    if (!root) return

    const q = (selector: string) =>
      Array.from(root.querySelectorAll<HTMLElement>(selector))
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (reduced) return

    const revealTargets = q(
      '.motion-mask-image, .motion-content, .motion-feature-card'
    )
    revealTargets.forEach(target => {
      target.style.willChange = 'transform, opacity, clip-path'
    })

    let played = false
    const stopReveal = inView(
      root,
      () => {
        if (played) return
        played = true

        const controls = animate(
          [
            [
              q('.motion-mask-image'),
              {
                clipPath: [
                  'inset(100% 0 0 0)',
                  'inset(0% 0 0 0)'
                ],
                scale: [1.1, 1]
              },
              { duration: 1.25, ease: [0.16, 1, 0.3, 1] }
            ],
            [
              q('.motion-content'),
              { opacity: [0, 1], y: [40, 0] },
              {
                duration: 0.85,
                at: 0.25,
                delay: stagger(0.1),
                ease: [0.22, 1, 0.36, 1]
              }
            ],
            [
              q('.motion-feature-card'),
              { opacity: [0, 1], x: [-20, 0] },
              {
                duration: 0.7,
                at: 0.48,
                delay: stagger(0.1),
                ease: [0.22, 1, 0.36, 1]
              }
            ]
          ],
          { defaultTransition: { type: 'tween' } }
        )

        controls.then(() => {
          revealTargets.forEach(target => {
            target.style.willChange = 'auto'
          })
        })

        return () => controls.stop()
      },
      { margin: '0px 0px -18% 0px', amount: 0.16 }
    )

    const pulseControls = q('.motion-badge-pulse').map(element =>
      animate(
        element,
        { scale: [1, 1.05, 1], opacity: [0.75, 1, 0.75] },
        { duration: 1.5, ease: 'easeInOut', repeat: Infinity }
      )
    )

    return () => {
      stopReveal()
      pulseControls.forEach(control => control.stop())
    }
  }, [])

  return (
    <article ref={container} className='overflow-hidden py-24'>
      <div className='container mx-auto max-w-7xl px-4'>
        <div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-24'>
          <div className='order-2 flex flex-col justify-center lg:order-1'>
            <div className='motion-content mb-8 inline-flex items-center self-start rounded-full bg-card px-4 py-1.5 opacity-0 backdrop-blur-md'>
              <span className='relative mr-3 flex h-2 w-2'>
                <span className='motion-badge-pulse absolute inline-flex size-full rounded-full bg-card opacity-75'></span>
                <span className='dark:bg-dark-foreground relative inline-flex h-2 w-2 rounded-full bg-foreground'></span>
              </span>
              <span className='text-foreground outline-hidden'>
                Siste sjanse
              </span>
            </div>

            <h2 className='motion-content outline-hiddenfont-google-sans mb-6 bg-linear-to-r from-slate-900 via-slate-500 to-slate-900 bg-clip-text text-4xl font-bold text-white opacity-0 sm:text-5xl lg:text-6xl'>
              Vi rydder plass til <br />
              <span className='dark:from-dark-primary dark:via-dark-accent dark:to-dark-primary bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-left text-transparent'>
                sesongens nyheter
              </span>
            </h2>

            <p className='motion-content mb-10 max-w-lg rounded-lg p-1 text-left text-lg leading-relaxed text-foreground opacity-0'>
              Begrenset antall og størrelser – førstemann til
              mølla!
            </p>

            <div className='mb-10 grid w-full grid-cols-1 gap-4'>
              {[
                {
                  icon: Thermometer,
                  title: 'SherpaCore™',
                  desc: '250 GSM fôr som gir umiddelbar isolering.',
                  color:
                    'text-background dark:text-dark-background',
                  bg: 'bg-foreground-muted'
                },
                {
                  icon: Droplets,
                  title: 'Tørker deg opp',
                  desc: 'Fôret absorberer restfuktighet effektivt.',
                  color:
                    'text-background dark:text-dark-background',
                  bg: 'bg-card '
                },
                {
                  icon: Wind,
                  title: 'Stopper vinden',
                  desc: 'HydroGuard™ skall med 8000mm vannsøyle.',
                  color: 'text-foreground ',
                  bg: 'bg-primary dark:bg-dark-primary'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className='motion-feature-card group dark:border-dark-foreground/70 dark:hover:border-dark-foreground/40 flex items-center gap-5 rounded-xl border border-foreground/70 bg-white/2 p-4 opacity-0 transition-all duration-300 hover:translate-x-1 hover:border-foreground/40 hover:bg-white/5'
                >
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-lg border border-white/5 ${item.bg} transition-transform group-hover:scale-110`}
                  >
                    <item.icon
                      className={`size-7 ${item.color}`}
                    />
                  </div>
                  <div>
                    <h3 className='mb-0.5 font-utekos-text-medium text-base text-white transition-colors group-hover:text-amber-100'>
                      {item.title}
                    </h3>
                    <p className='text-foreground-muted dark:group-hover:text-dark-foreground text-sm transition-colors group-hover:text-foreground'>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className='motion-content flex flex-col gap-4 opacity-0 sm:flex-row'>
              <BrandBadge
                asChild
                backgroundColor='var(--color-primary)'
                textColor='var(--color-background)'
                className='group h-14 w-full justify-center px-8 text-base font-medium shadow-[0_18px_42px_-26px_rgba(27,53,74,0.42)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95 sm:w-auto'
              >
                <Link
                  href={'/produkter/comfyrobe' as Route}
                  data-track='FrontpageIceBathingSectionShopNowClick'
                >
                  Sikre deg din nå
                  <ArrowRight className='ml-2 size-5 transition-transform group-hover:translate-x-1' />
                </Link>
              </BrandBadge>
              <BrandBadge
                asChild
                backgroundColor='var(--color-foreground-muted)'
                textColor='var(--color-background)'
                className='group dark:ring-dark-background/10 h-14 w-full justify-center px-8 text-base font-medium ring-1 ring-background/10 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95 sm:w-auto md:w-[162px] lg:w-[182px]'
              >
                <Link
                  href={'/inspirasjon/isbading' as Route}
                  data-track='FrontpageIceBathingSectionGetInspoClick'
                >
                  Les mer
                  <ArrowRight className='ml-2 h-5 w-5 transition-transform group-hover:translate-x-1' />
                </Link>
              </BrandBadge>
            </div>

            <div className='motion-content text-foreground-muted mt-6 flex items-center gap-2 text-sm opacity-0'>
              <AlertCircle className='dark:text-dark-primary h-4 w-4 text-primary' />
              <span className='italic'>
                OBS: Begrenset antall igjen på lager.
              </span>
            </div>
          </div>

          <div className='relative order-1 w-full lg:order-2 lg:flex lg:justify-end'>
            <div className='mx-auto w-full max-w-120 lg:mx-0'>
              <div className='motion-mask-image aspect-2/3verflow-hidden relative rounded-3xl border border-white/10 bg-transparent shadow-2xl'>
                <Image
                  src={ComfyrobeOriginal}
                  alt='En isbader står ved en iskant og ser utover vannet, pakket inn i en varm Comfyrobe etter badet.'
                  fill
                  className='object-cover object-bottom transition-transform duration-[2s] hover:scale-105'
                  sizes='(max-width: 1024px) 100vw, 50vw'
                />
                <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-neutral-950/60 via-transparent to-transparent' />

                <BrandBadge
                  backgroundColor='var(--color-foreground-muted)'
                  textColor='var(--color-background)'
                  className='dark:ring-dark-background/10 absolute top-6 right-6 px-4 py-2 text-sm font-medium shadow-[0_16px_32px_-24px_rgba(18,24,29,0.45)] ring-1 ring-background/10'
                >
                  Comfyrobe™
                </BrandBadge>
              </div>
            </div>

            <div className='bg-foreground-muted pointer-events-none absolute -right-10 -bottom-10 -z-10 h-64 w-64 rounded-full blur-[100px]' />
          </div>
        </div>
      </div>
    </article>
  )
}
