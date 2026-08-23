// Path: src/components/header/ClientMobileMenu.tsx
'use client'

import type { MenuItem } from '@types'
import dynamic from 'next/dynamic'
import { useSyncExternalStore } from 'react'

const MobileMenu = dynamic(
  () =>
    import('@/components/header/MobileMenu/MobileMenu').then(
      mod => mod.MobileMenu
    ),
  {
    ssr: false,
    loading: () => <div className='h-11 min-w-11 md:min-w-23' />
  }
)

export function ClientMobileMenu({
  menu
}: {
  menu: MenuItem[]
}) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!isMounted) {
    return <div aria-hidden className='h-11 min-w-11 shrink-0 md:min-w-23' />
  }

  return <MobileMenu menu={menu} />
}
