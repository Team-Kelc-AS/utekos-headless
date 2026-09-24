'use cache'

import { cacheLife, cacheTag } from 'next/cache'
import Link from 'next/link'
import { cn } from '@/lib/utils/className'
import { HeroImage } from './HeroImage'
import { MotionContent } from './MotionContent'
import {
  HERO_H1,
  HERO_INTRO_PARAGRAPHS,
  HERO_QUICK_LINKS
} from './heroCopy'

export async function HeroSection() {
  cacheLife('days')
  cacheTag('static-sections', 'home-hero')

  return (
    <article
      className={cn(
        'isolate mx-auto w-screen overflow-hidden rounded-b-2xl bg-night px-5 pt-5 pb-10 font-sans text-foreground sm:px-6 sm:py-12 lg:py-16'
      )}
    >
      <div className='relative mx-auto flex w-full max-w-none flex-col items-center justify-center overflow-hidden text-center sm:max-w-[95%] lg:max-w-none'>
        <HeroImage />
        <div className='w-full px-4 sm:px-0'>
          <h1
            id='hero-h1'
            className='mx-auto max-w-3xl pt-6 text-center text-3xl font-semibold text-balance text-foreground sm:pt-8 md:text-5xl'
          >
            {HERO_H1}
          </h1>
          <MotionContent />
          <div className='mx-auto mt-8 max-w-prose sm:mt-10'>
            {HERO_INTRO_PARAGRAPHS.map(paragraph => (
              <p
                key={paragraph.slice(0, 24)}
                className='mt-4 text-base text-pretty text-foreground/80 first:mt-0 sm:text-lg'
              >
                {paragraph}
              </p>
            ))}
            <ul className='mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2'>
              {HERO_QUICK_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-sm font-medium underline underline-offset-4 hover:no-underline sm:text-base'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  )
}
