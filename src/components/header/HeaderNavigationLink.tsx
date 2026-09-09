'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ComponentProps } from 'react'

export function HeaderNavigationLink({
  prefetch = null,
  onMouseEnter,
  onFocus,
  ...props
}: ComponentProps<typeof Link>) {
  const pathname = usePathname()
  const [intentPath, setIntentPath] = useState<string | null>(null)
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
