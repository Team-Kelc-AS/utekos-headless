// Path: src/components/header/Header.tsx

import { Cart } from '@/components/cart/Cart'
import { HeaderSearch } from '@/components/header/HeaderSearch/HeaderSearch'
import type { MenuItem } from '@types'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { HeadphonesIcon } from 'lucide-react'
import { ClientMobileMenu } from './ClientMobileMenu'
import wordmarkwhite from '@/assets/images/brand/WordmarkWhite.svg'

export default function Header({
  menu
}: {
  menu: MenuItem[]
}) {
  return (
    <header className='top-0! z-50 bg-night w-full text-foreground'>
      <div className='relative mx-auto grid min-h-18 w-full grid-cols-[auto_1fr] items-center gap-3 px-4 py-2.5 sm:px-6 lg:min-h-20 lg:px-10 xl:min-h-22.5'>
        <div className='flex min-w-0 items-center justify-start'>
          <Link
            href={'/' as Route}
            aria-label='Utekos - Til forsiden'
            data-track='HeaderLogoClick'
            className='flex h-14 items-center pl-2 lg:h-16'
          >
            <Image
              src='/IconWhite.svg'
              alt=''
              width={1280}
              height={1109}
              loading='eager'
              fetchPriority='high'
              className='h-8 w-auto sm:hidden'
            />
            <Image
              src={wordmarkwhite}
              alt=''
              width={300}
              height={73}
              loading='eager'
              fetchPriority='high'
              className='hidden h-7 w-auto sm:block sm:h-8 lg:h-9 xl:h-10'
            />
          </Link>
        </div>

        <div className='flex min-w-0 items-center justify-end gap-1.5 sm:gap-2 lg:gap-3'>
          <HeaderSearch variant='nav' />

          <Link
            href={'/kontaktskjema' as Route}
            data-track='HeaderCustomerServiceClick'
            className='dark:focus-visible:ring-dark-ring hidden h-11 min-w-31 items-center justify-center gap-2 rounded-md px-3 font-utekos-text-medium text-sm text-foreground transition outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring md:inline-flex dark:hover:bg-accent'
          >
            <HeadphonesIcon
              className='size-4'
              aria-hidden
            />
            <span>Kundeservice</span>
          </Link>

          <Cart
            showLabel
            className='dark:hover:bg-dark-accent h-11 min-w-29 rounded-md border-transparent bg-transparent px-3 text-foreground hover:bg-accent hover:text-accent-foreground'
          />

          <ClientMobileMenu menu={menu} />
        </div>
      </div>
    </header>
  )
}