'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function ConsentPresentationBridge() {
  const pathname = usePathname()
  const previous = useRef(pathname)
  const [unavailable, setUnavailable] = useState(false)
  useEffect(() => {
    if (previous.current !== pathname) {
      previous.current = pathname
      window.dispatchEvent(
        new Event('utekos:consent:navigation')
      )
    }
  }, [pathname])
  useEffect(() => {
    const failed = () => setUnavailable(true)
    window.addEventListener('utekos:consent:unavailable', failed)
    return () =>
      window.removeEventListener(
        'utekos:consent:unavailable',
        failed
      )
  }, [])
  function open() {
    setUnavailable(false)
    const current = window as Window & {
      UtekosConsentPresentation?: { open: () => void }
      Cookiebot?: { renew?: () => void }
    }
    if (current.UtekosConsentPresentation)
      current.UtekosConsentPresentation.open()
    else if (current.Cookiebot?.renew) current.Cookiebot.renew()
    else setUnavailable(true)
  }
  return (
    <aside
      aria-label='Personvern'
      className='fixed bottom-3 left-3 z-40 max-w-[min(24rem,calc(100vw-1.5rem))] rounded-xl border border-[#00453e] bg-[#f0eee9] px-2 py-1 text-sm text-[#002521] shadow-sm'
    >
      <button
        type='button'
        onClick={open}
        className='min-h-11 rounded px-3 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2'
      >
        Personverninnstillinger
      </button>
      {unavailable && (
        <p role='status'>
          Samtykketjenesten er ikke tilgjengelig ennå. Valgfrie
          funksjoner er avslått. Prøv igjen, eller les{' '}
          <a href='/personvern' className='underline'>
            personvernerklæringen
          </a>
          .
        </p>
      )}
    </aside>
  )
}
