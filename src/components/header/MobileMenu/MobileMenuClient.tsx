// Path: src/components/header/MobileMenuClient.tsx
'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useReducer } from 'react'

import { MobileMenuPanel } from '@/components/header/MobileMenu/MobileMenuPanel'
import { menuReducer } from '@/lib/utils/menuReducer'
import type { MenuItem } from '@types'

export function MobileMenuClient({
  menu,
  iconOnly = false
}: {
  menu: MenuItem[]
  iconOnly?: boolean
}) {
  const [state, dispatch] = useReducer(menuReducer, { status: 'CLOSED' })
  const pathname = usePathname()

  useEffect(() => {
    dispatch({ type: 'CLOSE_MENU' })
  }, [pathname])

  useEffect(() => {
    if (state.status !== 'OPEN') return

    const previousBodyOverflow = document.body.style.overflow
    const previousDocumentOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousDocumentOverflow
    }
  }, [state.status])

  return (
    <MobileMenuPanel
      menu={menu}
      iconOnly={iconOnly}
      isOpen={state.status === 'OPEN'}
      onOpenChange={isOpen => {
        if (isOpen) {
          dispatch({ type: 'OPEN_MENU' })
        } else {
          dispatch({ type: 'CLOSE_MENU' })
        }
      }}
    />
  )
}
