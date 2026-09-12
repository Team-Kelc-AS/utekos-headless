'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ComponentProps } from 'react'
import { resolveSkreddersyVarmenPublicPathname } from '@/lib/experiments/skreddersyVarmenLayoutRoute'

export function HeaderNavigationLink({
  prefetch = null,
  onMouseEnter,
  onFocus,
  ...props
}: ComponentProps<typeof Link>) {
  const pathname =
    resolveSkreddersyVarmenPublicPathname(usePathname())
  const [intentPath, setIntentPath] = useState<string | null>(
    null
  )
  const waitForIntent =
    pathname === '/skreddersy-varmen' && intentPath !== pathname

  return (
    <Link
      {...props}
      prefetch={waitForIntent ? false : prefetch}
      onMouseEnter={event => {
        setIntentPath(pathname)
        onMouseEnter?.(event)
      }}
      onFocus={event => {
        setIntentPath(pathname)
        onFocus?.(event)
      }}
    />
  )
}
