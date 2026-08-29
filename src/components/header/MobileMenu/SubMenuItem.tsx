// Path: src/components/header/MobileMenu/SubMenuItem.tsx

import Link from 'next/link'
import { normalizeShopifyUrl } from '@/lib/helpers/normalizers/normalizeShopifyUrl'
import type { MenuItem } from '@types'
import type { Route } from 'next'
import { ChevronRight } from 'lucide-react'

export function SubMenuItem({ item }: { item: MenuItem }) {
  return (
    <Link
      href={normalizeShopifyUrl(item.url) as Route}
      className='group /88 relative flex w-full items-center justify-between rounded-xl border border-transparent bg-foreground/[0.035] px-3.5 py-3 text-foreground/88 no-underline transition-[background,border-color] hover:border-foreground/10 hover:bg-foreground/6 hover:no-underline focus-visible:ring-2 focus-visible:ring-foreground/35 active:scale-[0.99]'
    >
      <div className='absolute top-1/2 left-2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-linear-to-b from-very-peri/74 via-ancient-water/50 to-transparent opacity-70' />

      <div className='flex min-w-0 items-center gap-3 pl-2'>
        <span className='truncate text-[14px] leading-tight font-medium tracking-[-0.01em]'>
          {item.title}
        </span>
      </div>

      <ChevronRight className='/58 size-4 text-foreground/58 transition-transform duration-200 group-active:translate-x-0.5' />
    </Link>
  )
}
