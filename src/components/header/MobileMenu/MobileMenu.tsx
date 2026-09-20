// Path: src/components/header/MobileMenu/MobileMenu.tsx

'use client'

import { MobileMenuClient } from '@/components/header/MobileMenu/MobileMenuClient'
import type { MenuItem } from '@types'

export function MobileMenu({
  menu,
  iconOnly = false
}: {
  menu: MenuItem[]
  iconOnly?: boolean
}) {
  return <MobileMenuClient menu={menu} iconOnly={iconOnly} />
}
