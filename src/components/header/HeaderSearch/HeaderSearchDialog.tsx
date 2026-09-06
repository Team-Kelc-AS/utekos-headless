'use client'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList
} from '@/components/ui/command'
import { cn } from '@/lib/utils/className'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import {
  Suspense,
  startTransition,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react'
import { HeaderSearchFooter } from './HeaderSearchFooter'
import { SearchResults } from './SearchResults'

type HeaderSearchDialogProps = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  className?: string | undefined
}

export function HeaderSearchDialog({
  open,
  setOpen,
  className
}: HeaderSearchDialogProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearchQuery('')
    }

    setOpen(isOpen)
  }

  const handleNavigate = (path: string) => {
    handleOpenChange(false)
    startTransition(() => {
      router.push(path as Route)
    })
  }

  return (
    <CommandDialog
      data-nosnippet
      open={open}
      onOpenChange={handleOpenChange}
      showCloseButton={false}
      className={cn(
        'mx-auto! h-[50vh] max-w-3xl rounded-xl p-2 pb-11 shadow-2xl md:max-w-4xl lg:max-w-5xl',
        'bg-popover text-popover-foreground',
        'border border-border ring-2 ring-ring/20',
        'backdrop-blur-md',
        className
      )}
      title='Skreddersy varmen'
      description='Søk etter produkter eller sider..'
    >
      <Command className='h-full rounded-none bg-transparent'>
        <CommandInput
          placeholder='Søk på nettsiden..'
          autoFocus
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList className='no-scrollbar min-h-80 scroll-pt-2 scroll-pb-1.5'>
          <Suspense
            fallback={
              <div className='p-2'>
                <div className='mb-4 h-5 w-1/4 animate-pulse rounded-md bg-muted' />
                <div className='space-y-2'>
                  <div className='h-8 w-full animate-pulse rounded-md bg-muted' />
                  <div className='h-8 w-full animate-pulse rounded-md bg-muted' />
                  <div className='h-8 w-full animate-pulse rounded-md bg-muted' />
                </div>
              </div>
            }
          >
            <SearchResults onSelect={handleNavigate} />
          </Suspense>
          <CommandEmpty>Ingen treff.</CommandEmpty>
        </CommandList>
      </Command>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 flex h-10 items-center justify-between border-t border-foreground/10 px-3 text-xs',
          'bg-popover text-popover-foreground'
        )}
      >
        <HeaderSearchFooter />
      </div>
    </CommandDialog>
  )
}
