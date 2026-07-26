'use client'

import { useEffect, useRef, useState } from 'react'

const COOKIEBOT_DOMAIN_GROUP_ID =
  'f2145160-1ac5-4859-8385-36dc6327495f'

type CookiebotWindow = Window & {
  Cookiebot?: {
    renew?: () => void
  }
}

export function CookieDeclaration() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const script = document.createElement('script')
    script.id = 'CookieDeclaration'
    script.src = `https://consent.cookiebot.com/${COOKIEBOT_DOMAIN_GROUP_ID}/cd.js`
    script.async = true
    script.addEventListener('error', () => setLoadFailed(true))
    container.appendChild(script)

    return () => {
      container.replaceChildren()
    }
  }, [])

  return (
    <div className='not-prose mt-8 space-y-6'>
      <div
        ref={containerRef}
        aria-live='polite'
        aria-label='Oppdatert oversikt over informasjonskapsler'
        className='min-h-24 overflow-x-auto rounded-none border border-white/15 bg-black/10 p-4'
      >
        {loadFailed ?
          <p role='alert' className='text-sm leading-6 text-white/80'>
            Cookie-oversikten kunne ikke lastes. Du kan fortsatt endre valgene
            dine med knappen nedenfor, eller prøve å laste siden på nytt.
          </p>
        : null}
      </div>

      <button
        type='button'
        className='min-h-11 border border-white/70 px-5 py-3 text-sm font-utekos-text-medium text-white underline-offset-4 hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
        onClick={() => {
          ;(window as CookiebotWindow).Cookiebot?.renew?.()
        }}
      >
        Endre cookie-innstillinger
      </button>
    </div>
  )
}
