'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { ArrowRight } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { TechDownfeatures } from './TechDownFeatures'
import { TechDownImages } from './TechDownImages'
import { animate, inView, stagger } from 'motion'
import type { Route } from 'next'

export const TechDownFeatureSection = () => {
  const container = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = container.current
    if (!root) return

    const q = (selector: string) =>
      Array.from(root.querySelectorAll<HTMLElement>(selector))
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const visualTargets = q('.motion-visual')
    const contentTargets = q('.motion-content')
    const featureTargets = q('.motion-feature-item')
    const revealTargets = [
      ...visualTargets,
      ...contentTargets,
      ...featureTargets
    ]
    const glowTargets = q('.motion-glow')

    if (prefersReducedMotion) return

    revealTargets.forEach(target => {
      target.style.opacity = '0'
      target.style.willChange = 'transform, opacity'
    })

    let stopRevealAnimation = () => {}
    const stopReveal = inView(
      root,
      () => {
        const controls = animate(
          [
            [
              visualTargets,
              { opacity: [0, 1], x: [-50, 0], scale: [0.95, 1] },
              { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
            ],
            [
              contentTargets,
              { opacity: [0, 1], y: [30, 0] },
              {
                duration: 0.65,
                at: 0.22,
                delay: stagger(0.08),
                ease: [0.22, 1, 0.36, 1]
              }
            ],
            [
              featureTargets,
              { opacity: [0, 1], x: [20, 0] },
              {
                duration: 0.45,
                at: 0.42,
                delay: stagger(0.08),
                ease: [0.34, 1.56, 0.64, 1]
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

        stopRevealAnimation = () => controls.stop()
      },
      { margin: '0px 0px -18% 0px', amount: 0.16 }
    )

    let stopGlowAnimations = () => {}
    const stopGlowObserver = inView(
      root,
      () => {
        const controls = glowTargets.map(element =>
          animate(
            element,
            { opacity: [1, 0.3, 1], scale: [1, 1.2, 1] },
            { duration: 4, ease: 'easeInOut', repeat: Infinity }
          )
        )

        stopGlowAnimations = () => {
          controls.forEach(control => control.cancel())
        }

        return stopGlowAnimations
      },
      { margin: '160px 0px' }
    )

    return () => {
      stopReveal()
      stopRevealAnimation()
      stopGlowObserver()
      stopGlowAnimations()
    }
  }, [])

  return (
    <article
      ref={container}
      className='relative my-24 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,color-mix(in_oklch,var(--color-maritime-800)_82%,rgba(13,21,31,0.96))_0%,color-mix(in_oklch,var(--background)_92%,rgba(10,16,24,0.98))_52%,color-mix(in_oklch,var(--color-maritime-800)_84%,rgba(13,21,31,0.96))_100%)] py-0 md:my-32'
    >
      <div className='motion-glow bg-foreground-muted/12 pointer-events-none absolute top-1/2 left-[-10%] h-150 w-150 -translate-y-1/2 rounded-full blur-[120px]' />
      <div className='motion-glow bg-soft-warm/10 pointer-events-none absolute right-[-10%] bottom-0 h-125 w-125 rounded-full blur-[100px]' />

      <div className='container mx-auto grid grid-cols-1 items-center gap-12 py-2 lg:grid-cols-2 lg:gap-20'>
        <div className='motion-visual w-full'>
          <div className='dark:border-dark-foreground/10 dark:bg-dark-foreground/4 relative aspect-square rounded-2xl border border-foreground/10 bg-foreground/4 p-2 shadow-[0_32px_80px_-44px_rgba(8,15,24,0.92)] backdrop-blur-sm'>
            <Carousel
              className='w-full'
              slideCount={TechDownImages.length}
              opts={{ loop: true }}
            >
              <CarouselContent>
                {TechDownImages.map((image, index) => (
                  <CarouselItem
                    key={image.alt}
                    className='p-3 sm:p-4'
                  >
                    <div className='dark:bg-dark-foreground/4 relative aspect-square w-full overflow-hidden rounded-3xl bg-foreground/4 p-3 sm:p-4'>
                      <div className='relative size-full overflow-hidden rounded-[1.15rem]'>
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          className='object-cover object-center drop-shadow-2xl'
                          sizes='(max-width: 1024px) 100vw, 42vw'
                          priority={index === 0}
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className='dark:border-dark-foreground/12 dark:bg-dark-background/72 dark:hover:bg-dark-background/88 hover:text-foreground-muted left-4 border-foreground/12 bg-background/72 text-foreground backdrop-blur-md hover:bg-background/88' />
              <CarouselNext className='dark:border-dark-foreground/12 dark:bg-dark-background/72 dark:hover:bg-dark-background/88 hover:text-foreground-muted right-4 border-foreground/12 bg-background/72 text-foreground backdrop-blur-md hover:bg-background/88' />
            </Carousel>
          </div>
        </div>

        <div className='flex flex-col items-start px-4 lg:px-0'>
          <h2 className='motion-content font-google-sans mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl'>
            Møt Utekos <br />
            <span className='text-foreground'>TechDown™</span>
          </h2>

          <p className='motion-content /90 mb-8 max-w-lg text-lg leading-relaxed text-foreground/90'>
            Vi har ikke bare kombinert det beste fra dunens
            letthet og mikrofiberens slitestyrke – vi har
            utviklet en helt ny kategori av personlig komfort.
          </p>

          <ul className='mb-10 w-fit max-w-full space-y-3'>
            {TechDownfeatures.map((feature, index) => (
              <li
                key={index}
                className='motion-feature-item group dark:bg-dark-foreground/3 dark:hover:border-dark-foreground/14 dark:hover:bg-dark-foreground/8 flex items-center gap-4 rounded-xl border border-transparent bg-foreground/3 px-4 py-3.5 transition-all duration-300 hover:translate-x-1 hover:border-foreground/14 hover:bg-foreground/8'
              >
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-transform group-hover:scale-110'>
                  <feature.icon className='h-5 w-5' />
                </div>
                <span className='dark:group-hover:text-dark-foreground font-utekos-text-medium text-foreground/90 transition-colors group-hover:text-foreground'>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          <div className='motion-content'>
            <BrandBadge
              asChild
              backgroundColor='var(--color-primary)'
              textColor='var(--color-background)'
              className='group h-14 px-8 text-base shadow-[0_20px_46px_-28px_rgba(20,30,40,0.56)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95'
            >
              <Link
                href={'/produkter/utekos-techdown' as Route}
                data-track='TechDownProductPageSectionShopNowClick'
              >
                Les mer
                <ArrowRight className='ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1' />
              </Link>
            </BrandBadge>
          </div>
        </div>
      </div>
    </article>
  )
}
