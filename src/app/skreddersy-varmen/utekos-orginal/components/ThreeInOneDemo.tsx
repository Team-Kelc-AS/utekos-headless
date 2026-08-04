'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import type { Mode } from '@types'
import { modes } from '@/app/skreddersy-varmen/utekos-orginal/utils/modes'
export function ThreeInOneDemo() {
  const [activeMode, setActiveMode] =
    useState<Mode>('fulldekket')

  const activeModeData = modes.find(m => m.id === activeMode)

  return (
    <article className='w-full overflow-hidden bg-jungle py-16 text-[#F4F1EA] md:py-24'>
      <div className='mx-auto max-w-6xl px-4 text-center md:px-6'>
        <AnimatedBlock className='animate-on-scroll mb-6 md:mb-12'>
          <span className='mb-3 block font-utekos-text-medium text-xs tracking-wide text-primary uppercase md:text-sm'>
            Modulært system
          </span>
          <h3 className='mb-4 font-serif text-3xl md:mb-6 md:text-5xl'>
            Ett plagg. Uendelig med muligheter.
          </h3>
          <p className='mx-auto max-w-xl text-base font-light text-[#F4F1EA]/70 md:text-lg'>
            Veksle sømløst mellom modusene for å tilpasse deg
            vær, aktivitet og humør.
          </p>
        </AnimatedBlock>
        <AnimatedBlock
          className='animate-on-scroll mb-6 md:mb-12'
          delay='0.1s'
        >
          <div className='no-scrollbar inline-flex w-full flex-nowrap justify-center gap-1 overflow-x-auto rounded-full border border-white/5 bg-black/20 p-1 backdrop-blur-sm md:w-auto md:gap-2 md:p-1.5'>
            {modes.map(mode => {
              const isActive = activeMode === mode.id
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap transition-all duration-300 ease-out md:flex-none md:gap-2 md:px-6 md:py-3 md:text-base ${
                    isActive ?
                      'scale-100 bg-dark-teal text-[#F4F1EA] shadow-lg'
                    : 'text-[#F4F1EA]/60 hover:bg-white/5 hover:text-[#F4F1EA]'
                  } `}
                >
                  <mode.icon
                    size={14}
                    className='text-foreground md:h-[18px] md:w-[18px]'
                  />
                  <span className='text-foreground'>{mode.title}</span>
                </button>
              )
            })}
          </div>
        </AnimatedBlock>
        <AnimatedBlock
          className='animate-on-scroll mx-auto w-full max-w-sm md:max-w-5xl'
          delay='0.2s'
        >
          <div className='relative aspect-9/16 w-full overflow-hidden rounded-2xl border border-[#F4F1EA]/10 bg-dark-teal shadow-2xl transition-[aspect-ratio] duration-300 md:aspect-video'>
            {modes.map(mode => {
              const isActive = activeMode === mode.id

              return (
                <div
                  key={mode.id}
                  className={`absolute inset-0 h-full w-full transition-all duration-700 ease-in-out ${isActive ? 'z-10 scale-100 opacity-100' : 'pointer-events-none z-0 scale-105 opacity-0'} `}
                >
                  <div className='relative block h-full w-full md:hidden'>
                    <Image
                      src={mode.mobileSrc}
                      alt={`Utekos ${mode.title} mobilvisning`}
                      fill
                      className='object-cover object-top'
                      sizes='(max-width: 768px) 100vw'
                      priority={mode.id === 'fulldekket'}
                      quality={90}
                    />
                  </div>

                  <div className='relative hidden h-full w-full md:block'>
                    <Image
                      src={mode.desktopSrc}
                      alt={`Utekos ${mode.title} desktopvisning`}
                      fill
                      className={
                        mode.id === 'fulldekket' ?
                          'object-cover object-center'
                        : 'object-contain'
                      }
                      sizes='80vw'
                      priority={mode.id === 'fulldekket'}
                      quality={100}
                    />
                  </div>
                  <div className='absolute inset-0 z-10 hidden bg-linear-to-t from-[#2C2420] via-transparent to-black/10 opacity-60 md:block' />

                  <div
                    className={`absolute z-20 hidden rounded-xl border border-white/10 bg-black/40 p-6 text-left backdrop-blur-md transition-all delay-100 duration-500 md:bottom-12 md:left-12 md:block md:w-auto md:max-w-md ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} `}
                  >
                    <div className='mb-2 flex items-center gap-3 text-commerce-primary dark:text-dark-commerce-primary'>
                      <mode.icon size={20} />
                      <h4 className='font-google-sans font-serif text-xl font-bold tracking-wide capitalize'>
                        {mode.title}
                      </h4>
                    </div>
                    <p className='text-base leading-relaxed text-[#F4F1EA] opacity-90'>
                      {mode.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {activeModeData && (
            <div className='animate-fade-in-up mt-4 rounded-xl border border-white/5 bg-white/5 p-4 text-left md:hidden'>
              <div className='mb-2 flex items-center gap-2 text-commerce-primary dark:text-dark-commerce-primary'>
                <activeModeData.icon
                  size={18}
                  className='text-primary'
                />
                <h4 className='font-google-sans font-serif text-lg font-bold tracking-wide text-primary capitalize'>
                  {activeModeData.title}
                </h4>
              </div>
              <p className='text-sm leading-relaxed text-[#F4F1EA]/80'>
                {activeModeData.desc}
              </p>
            </div>
          )}
        </AnimatedBlock>
      </div>
    </article>
  )
}
