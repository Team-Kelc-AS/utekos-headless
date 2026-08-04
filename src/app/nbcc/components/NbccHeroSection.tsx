'use client'

import { BadgeCheckIcon } from '@/components/animate-icons/icons/badge-check'
import { ClockIcon } from '@/components/animate-icons/icons/clock'
import { CompassIcon } from '@/components/animate-icons/icons/compass'
import { MoveRightIcon } from '@/components/animate-icons/icons/move-right'
import { Button } from '@/components/ui/button'
import heroImage from '@/assets/images/campaign/nbcc-retro-master.webp'
import nbccLogo from '@/assets/images/campaign/NBCC_logo_RGB_lys_bg.png'
import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'motion/react'

import { nbccHeroTracking } from '../utils/nbccLandingPageContent'
import { NbccAiSummaryButton } from './NbccAiSummaryButton'

const heroContentVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 }
}

export function NbccHeroSection() {
  return (
    <motion.section
      initial='hidden'
      animate='visible'
      transition={{ staggerChildren: 0.085 }}
      className='dark:bg-dark-background relative isolate overflow-hidden bg-background'
    >
      <div className='dark:from-dark-background absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent' />

      <div className='relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center lg:gap-x-16 lg:gap-y-0 lg:px-8 lg:py-28'>
        <motion.div
          variants={heroContentVariants}
          transition={{
            duration: 0.58,
            ease: [0.22, 1, 0.36, 1]
          }}
          data-nbcc-hero
          data-nbcc-animate
          data-nbcc-hero-content
          className='flex flex-wrap items-center gap-3 md:mb-8 lg:col-start-1'
        >
          <span className='inline-flex items-center gap-3 rounded-md border border-[#17130f]/15 bg-white px-3 py-2 shadow-sm'>
            <Image
              src={nbccLogo}
              alt='NBCC logo'
              width={150}
              height={60}
              className='h-9 w-auto object-contain'
            />
            <span
              className='h-8 w-px bg-neutral-300'
              aria-hidden
            />
            <span className='font-utekos-text-medium text-sm text-[#17130f]'>
              Medlemsfordel
            </span>
          </span>
        </motion.div>

        <motion.h1
          variants={heroContentVariants}
          transition={{
            duration: 0.58,
            ease: [0.22, 1, 0.36, 1]
          }}
          data-nbcc-hero
          data-nbcc-animate
          data-nbcc-hero-content
          className='font-utekos-text-medium text-5xl leading-[1.08] tracking-[-0.02em] text-balance text-foreground sm:text-6xl sm:leading-[1.06] lg:col-start-1 lg:text-7xl lg:leading-[1.05]'
        >
          NBCC-medlemsfordel hos Utekos
        </motion.h1>

        <motion.div
          variants={heroContentVariants}
          transition={{
            duration: 0.58,
            ease: [0.22, 1, 0.36, 1]
          }}
          data-nbcc-hero-content
          className='relative aspect-[2184/1920] w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 lg:col-start-2 lg:row-span-5 lg:row-start-1'
        >
          <Image
            src={heroImage}
            alt='Historisk NBCC-bilde'
            fill
            priority
            sizes='(max-width: 1024px) 100vw, 50vw'
            className='object-cover'
          />
        </motion.div>

        <motion.p
          variants={heroContentVariants}
          transition={{
            duration: 0.58,
            ease: [0.22, 1, 0.36, 1]
          }}
          data-nbcc-hero
          data-nbcc-animate
          data-nbcc-hero-content
          className='text-lg leading-8 text-pretty text-foreground sm:text-xl md:py-2 lg:col-start-1'
        >
          Helt siden 1960 har Norsk Bobil og Caravan Club samlet
          folk rundt de gode opplevelsene og gleden av å treffe
          andre campingelskere. Utekos deler lidenskapen for
          denne type sosiale og komfortable utendørsøyeblikk.
          Derfor gir vi deg en hyggelig medlemsrabatt, slik at du
          kan ta med deg enda mer varme og komfort ut i de sene
          kveldstimene.
        </motion.p>

        <motion.div
          variants={heroContentVariants}
          transition={{
            duration: 0.58,
            ease: [0.22, 1, 0.36, 1]
          }}
          data-nbcc-hero
          data-nbcc-animate
          data-nbcc-hero-content
          className='grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start lg:col-start-1 lg:mt-9'
        >
          <Button
            asChild
            size='lg'
            variant='commerce-primary'
            className='h-12 w-full justify-center rounded-md px-6 font-utekos-text-medium text-[15px] sm:w-auto'
          >
            <Link
              href='#produkter'
              data-track='NbccHeroProductsClick'
              data-track-data={JSON.stringify(
                nbccHeroTracking.primary
              )}
            >
              Finn din favoritt
              <MoveRightIcon
                size={18}
                animateOnHover='default'
              />
            </Link>
          </Button>

          <NbccAiSummaryButton
            intent='how-to-use'
            idleLabel='Få rabattveiledning'
            completedLabel='Vis rabattveiledningen'
            trackingName='NbccHeroHowToAiClick'
            trackingData={nbccHeroTracking.secondary}
            containerClassName='min-w-0 w-full'
            panelClassName='w-full sm:max-w-[32rem]'
            buttonClassName='h-12 w-full justify-center gap-2 rounded-md border border-commerce-secondary dark:border-dark-commerce-secondary bg-commerce-secondary dark:bg-dark-commerce-secondary px-6 text-[15px] font-utekos-text-medium text-commerce-secondary-foreground dark:text-dark-commerce-secondary-foreground hover:bg-commerce-secondary-hover dark:hover:bg-dark-commerce-secondary-hover hover:text-commerce-secondary-hover-foreground dark:hover:text-dark-commerce-secondary-hover-foreground sm:w-auto'
          />
        </motion.div>

        <motion.div
          variants={heroContentVariants}
          transition={{
            duration: 0.58,
            ease: [0.22, 1, 0.36, 1]
          }}
          data-nbcc-hero
          data-nbcc-animate
          data-nbcc-hero-content
          className='grid gap-4 border-t border-white/[0.16] pt-6 text-sm text-foreground sm:grid-cols-3 lg:col-start-1 lg:mt-12'
        >
          <div className='flex items-start gap-3'>
            <BadgeCheckIcon
              size={22}
              animate='check'
              className='dark:text-dark-primary mt-0.5 shrink-0 text-primary'
              aria-hidden
            />
            <span>
              Et beskyttende ytre forent med en silkemyk og
              tilpasningsdyktig kjerne.
            </span>
          </div>
          <div className='flex items-start gap-3'>
            <CompassIcon
              size={22}
              animate='default-loop'
              loop
              loopDelay={2400}
              className='mt-0.5 shrink-0 text-[#c7e6c9]'
              aria-hidden
            />
            <span>
              Lar deg ta regien over egen komfort. Helt
              friksjonsfritt.
            </span>
          </div>
          <div className='flex items-start gap-3'>
            <ClockIcon
              size={22}
              animate='default'
              className='mt-0.5 shrink-0 text-[#d8e7ff]'
              aria-hidden
            />
            <span>
              Fra morgenkaffe til kveldsamling. Bare justér, form
              og nyt.
            </span>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}
