'use client'

import { useEffect, useState } from 'react'
import {
  COOKIEBOT_CONSENT_EVENTS,
  hasCookiebotMarketingConsent,
  type CookiebotApi
} from '@/lib/consent/cookiebotConsent'

type ProductVideoPlayerProps = {
  className?: string
  src: string
  title?: string
}

type ProductVideoWindow = Window & {
  Cookiebot?: CookiebotApi & { renew?: () => void }
}

export function ProductVideoPlayer({
  className = 'relative aspect-430/932 w-full overflow-hidden',
  src,
  title = 'Produktvideo som viser Utekos i bruk'
}: ProductVideoPlayerProps) {
  const [marketingAllowed, setMarketingAllowed] =
    useState(false)

  useEffect(() => {
    const syncConsent = () => {
      setMarketingAllowed(
        hasCookiebotMarketingConsent(
          (window as ProductVideoWindow).Cookiebot
        )
      )
    }

    for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
      window.addEventListener(eventName, syncConsent)
    }

    syncConsent()

    return () => {
      for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
        window.removeEventListener(eventName, syncConsent)
      }
    }
  }, [])

  return (
    <div className={className}>
      {marketingAllowed ?
        <iframe
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          allowFullScreen
          className='absolute inset-0 size-full border-0'
          height='932'
          loading='lazy'
          referrerPolicy='strict-origin-when-cross-origin'
          src={src}
          title={title}
          width='430'
        />
      : <div className='absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black px-6 text-center text-white'>
          <p className='max-w-sm text-base leading-6'>
            Videoen leveres av YouTube og lastes først når du
            tillater markedsføring.
          </p>
          <button
            type='button'
            className='min-h-11 border border-white px-5 py-3 font-utekos-text-medium text-sm text-white underline-offset-4 hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
            onClick={() => {
              ;(
                window as ProductVideoWindow
              ).Cookiebot?.renew?.()
            }}
          >
            Endre cookie-innstillinger
          </button>
        </div>
      }
    </div>
  )
}
