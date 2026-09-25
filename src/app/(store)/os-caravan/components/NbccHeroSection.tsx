'use client'

import { BadgeCheckIcon } from '@/components/animate-icons/icons/badge-check'
import { ClockIcon } from '@/components/animate-icons/icons/clock'
import { CompassIcon } from '@/components/animate-icons/icons/compass'
import { Button } from '@/components/ui/button'
import heroImage from '@public/Eventyrdager.webp'
import Image from 'next/image'
import { motion, type Variants } from 'motion/react'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import osCaravanLogo from '@public/os-caravan.svg'
import { nbccHeroTracking } from '../utils/nbccLandingPageContent'
import { OS_CARAVAN_VENUE } from '../constants/venue'
import { OsCaravanSizeGuideDialog } from './OsCaravanSizeGuideDialog'

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
      className='relative isolate overflow-hidden bg-background'
    >
      <div className='absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent' />

      <div className='relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pt-6 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center lg:gap-x-16 lg:gap-y-0 lg:px-8 lg:pt-6 lg:pb-28'>
        <motion.div
          variants={heroContentVariants}
          transition={{
            duration: 0.58,
            ease: [0.22, 1, 0.36, 1]
          }}
          data-nbcc-hero
          data-nbcc-animate
          data-nbcc-hero-content
          className='flex flex-col gap-6 overflow-visible lg:col-start-1'
        >
          <div className='flex items-center gap-5 sm:gap-6'>
            <UtekosWordmark className='h-5.25 w-auto shrink-0 text-foreground sm:h-6.25' />
            <Image
              src={osCaravanLogo}
              alt='Os Caravan & Fritid'
              width={800}
              height={250}
              priority
              unoptimized
              className='relative z-10 h-10 w-auto object-contain sm:h-12'
            />
          </div>
          <h1 className='font-sans font-semibold text-5xl leading-[1.08] tracking-[-0.02em] text-balance text-foreground sm:text-6xl sm:leading-[1.06] lg:text-7xl lg:leading-[1.05]'>
            Eventyrdager hos Os Caravan & Fritid AS
          </h1>
        </motion.div>

        <motion.div
          variants={heroContentVariants}
          transition={{
            duration: 0.58,
            ease: [0.22, 1, 0.36, 1]
          }}
          data-nbcc-hero-content
          className='relative aspect-4/5 w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 lg:col-start-2 lg:row-span-4 lg:row-start-1'
        >
          <Image
            src={heroImage}
            alt='Eventyrdager hos Os Caravan & Fritid AS'
            fill
            priority
            sizes='(max-width: 1024px) 100vw, 50vw'
            className='object-cover'
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
          className='flex flex-col gap-2 lg:col-start-1'
        >
          <h2 className='font-sans text-xl font-semibold tracking-[-0.01em] text-balance text-primary sm:text-2xl'>
            Sikre deg din Utekos til kampanjepris!
          </h2>
          <p className='text-base text-foreground sm:text-lg'>
            Kun 1 790,- (ord. pris 1 990,-)
          </p>
          <p className='mt-2 text-lg leading-8 text-pretty text-foreground sm:text-xl'>
            Os Caravan viser deg markedets råeste bobiler og
            campingvogner. Samtidig inviterer Utekos deg til å
            utforske Utekos TechDown™ – nå til en eksklusiv
            messepris på kun 1790 kr.
          </p>
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
          className='flex flex-col gap-3 lg:col-start-1 lg:mt-9 sm:flex-row sm:items-start'
        >
          <OsCaravanSizeGuideDialog
            trackingData={nbccHeroTracking.primary}
            triggerClassName='h-12 w-full min-w-0 justify-center gap-2 rounded-2xl px-6 font-sans font-semibold text-base sm:flex-1'
          />

          <Button
            asChild
            size='lg'
            variant='commerce-secondary'
            className='h-12 w-full min-w-0 justify-center gap-2 rounded-2xl border-foreground/20 bg-jungle px-6 font-sans font-semibold text-base text-foreground hover:bg-jungle/80 hover:text-foreground sm:flex-1'
          >
            <a
              href={OS_CARAVAN_VENUE.directionsHref}
              target='_blank'
              rel='noopener noreferrer'
              data-track='Lead'
              data-track-data={JSON.stringify(
                nbccHeroTracking.directions
              )}
            >
              <span className='truncate'>Få veibeskrivelse</span>
              <span className='sr-only'> (åpnes i ny fane)</span>
              <CompassIcon
                size={18}
                animateOnHover='default'
              />
            </a>
          </Button>
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
          className='grid gap-4 border-t border-white/16 pt-6 text-sm text-foreground sm:grid-cols-3 lg:col-start-1 lg:mt-12'
        >
          <div className='flex items-start gap-3'>
            <BadgeCheckIcon
              size={22}
              animate='check'
              className='mt-0.5 shrink-0 text-primary'
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
