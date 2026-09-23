'use client'

import { useEffect, type ReactNode } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

const DESKTOP_PATH = '/produkter/utekos-techdown'

export function TechdownMobileOnly({
  children
}: {
  children: ReactNode
}) {
  const isMobile = useIsMobile()

  useEffect(() => {
    // Read the actual viewport: the hydration snapshot is initially false on mobile too.
    if (window.matchMedia('(min-width: 768px)').matches) {
      window.location.replace(
        DESKTOP_PATH +
          window.location.search +
          window.location.hash
      )
    }
  }, [isMobile])

  // Gate only mobile side effects. The gallery is outside this boundary so
  // its first image is discoverable in the server-rendered HTML.
  if (isMobile) return children

  return (
    <main className='techdown-redirect'>
      <p>Åpner TechDown-produktsiden…</p>
      <a href={DESKTOP_PATH}>Gå til TechDown</a>
    </main>
  )
}
