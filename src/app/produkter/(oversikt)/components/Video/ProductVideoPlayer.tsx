'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { VIDEO_POSTER_URL } from '@/constants'
import {
  hasCookiebotMarketingConsent,
  renewCookiebotConsent,
  subscribeToCookiebotConsent,
  type CookiebotMarketingApi
} from './cookiebotMarketingConsent'

type ProductVideoPlayerProps = {
  className?: string
  src: string
  title?: string
}

type CookiebotWindow = Window & {
  Cookiebot?: CookiebotMarketingApi
}

export function ProductVideoPlayer({
  className = 'relative aspect-430/932 w-full overflow-hidden',
  src,
  title = 'Produktvideo som viser Utekos i bruk'
}: ProductVideoPlayerProps) {
  const [hasMarketingConsent, setHasMarketingConsent] =
    useState(false)

  useEffect(() => {
    const updateConsent = () => {
      setHasMarketingConsent(
        hasCookiebotMarketingConsent(
          (window as CookiebotWindow).Cookiebot
        )
      )
    }

    updateConsent()
    return subscribeToCookiebotConsent(window, updateConsent)
  }, [])

  const openConsentSettings = () => {
    renewCookiebotConsent((window as CookiebotWindow).Cookiebot)
  }

  return (
    <div className={className}>
      {hasMarketingConsent ?
        <iframe
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          allowFullScreen
          className='absolute inset-0 size-full border-0'
          data-cookieconsent='marketing'
          height='932'
          loading='lazy'
          referrerPolicy='strict-origin-when-cross-origin'
          src={src}
          title={title}
          width='430'
        />
      : <div className='absolute inset-0 isolate flex items-end overflow-hidden bg-[#25283d]'>
          <Image
            fill
            alt=''
            className='object-cover object-center'
            sizes='(min-width: 1024px) 430px, 100vw'
            src={VIDEO_POSTER_URL}
          />
          <div
            aria-hidden='true'
            className='absolute inset-0 bg-linear-to-t from-black/90 via-black/35 to-black/5'
          />
          <div className='relative z-10 w-full px-5 pb-7 text-center text-white sm:px-7 sm:pb-9'>
            <p className='font-utekos-text text-base leading-relaxed font-semibold text-balance sm:text-lg'>
              Videoen lastes først når du tillater
              markedsføringsinnhold.
            </p>
            <button
              className='mt-4 min-h-11 rounded-full bg-white px-5 py-2.5 font-utekos-text text-sm font-bold text-[#172033] transition-colors hover:bg-white/90 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white'
              type='button'
              onClick={openConsentSettings}
            >
              Endre samtykke og spill av
            </button>
          </div>
        </div>
      }
    </div>
  )
}
