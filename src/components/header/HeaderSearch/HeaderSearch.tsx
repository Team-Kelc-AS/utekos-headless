'use client'

import { cn } from '@/lib/utils/className'
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { HeaderSearchInputField } from './HeaderSearchInputField'
import { useCommandK } from './useCommandK'
import { searchIndexQueryOptions } from './searchIndexQueryOption'

type HeaderSearchVariant = 'default' | 'nav'

const HeaderSearchDialog = dynamic(
  () =>
    import('./HeaderSearchDialog').then(
      module => module.HeaderSearchDialog
    ),
  { ssr: false }
)

export function HeaderSearch({
  className,
  variant = 'default'
}: {
  className?: string
  variant?: HeaderSearchVariant
}) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  useCommandK(open, setOpen)

  const handlePrefetch = () => {
    void queryClient
      .prefetchQuery(searchIndexQueryOptions)
      .catch(error => {
        reportClientCaughtError(error, 'header.search_prefetch')
      })
  }

  const handleOpen = () => {
    handlePrefetch()
    setOpen(true)
  }

  const buttonProps = {
    'type': 'button' as const,
    'onClick': handleOpen,
    'onMouseEnter': handlePrefetch,
    'onFocus': handlePrefetch,
    'onTouchStart': handlePrefetch,
    'aria-label': 'Åpne søk (⌘/Ctrl + K)',
    'className': cn(
      variant === 'nav' ?
        'group relative hidden h-11 min-w-[5.75rem] items-center justify-center gap-2 rounded-md px-3 font-utekos-text-medium text-sm text-foreground transition outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring md:flex'
      : 'group -foreground/10 relative hidden h-11 w-64 items-center gap-3 rounded-md border border-sidebar-foreground/25 bg-sidebar-foreground/10 px-3 text-left text-sm text-sidebar-foreground transition outline-none md:flex lg:w-52 xl:mr-3 xl:w-56 2xl:w-60',
      variant === 'default' &&
        'hover:border-sidebar-foreground/45 hover:bg-sidebar-foreground/15 focus-visible:border-sidebar-foreground/55',
      className
    )
  }

  return (
    <>
      <button {...buttonProps}>
        <HeaderSearchInputField
          showShortcut={variant === 'default'}
        />
      </button>

      {open ?
        <HeaderSearchDialog
          open={open}
          setOpen={setOpen}
          className={className}
        />
      : null}
    </>
  )
}
