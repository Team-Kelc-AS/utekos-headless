'use client'

import { useEffect, type ReactNode } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

const DESKTOP_PATH = '/produkter/utekos-svale'

export function SvaleMobileOnly({
  children
}: {
  children: ReactNode
}) {
  const isMobile = useIsMobile()

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      window.location.replace(
        DESKTOP_PATH +
          window.location.search +
          window.location.hash
      )
    }
  }, [isMobile])

  if (isMobile) return children

  return (
    <main className='svale-redirect'>
      <p>Åpner Svale-produktsiden…</p>
      <a href={DESKTOP_PATH}>Gå til Utekos Svale</a>
    </main>
  )
}
