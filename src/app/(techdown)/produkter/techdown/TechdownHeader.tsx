'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { Cart } from '@/components/cart/Cart'
import { mainMenu } from '@/db/config/menu.config'
import styles from './techdown.module.css'

export function TechdownHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Link
          href='/'
          className={styles.brand}
          aria-label='Utekos – forsiden'
        >
          <Image
            src='/IconWhite.svg'
            alt=''
            width={36}
            height={32}
            unoptimized
            className='h-8 w-auto'
          />
        </Link>
        <details
          className={styles.menu}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.currentTarget.open = false
              event.currentTarget
                .querySelector('summary')
                ?.focus()
            }
          }}
        >
          <summary
            aria-label='Åpne meny'
            className={styles.menuTrigger}
          >
            <svg
              width='28'
              height='28'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              aria-hidden='true'
            >
              <path d='M4 6h16M4 12h16M4 18h16' />
            </svg>
          </summary>
          <nav
            aria-label='Hovedmeny'
            className={styles.menuPanel}
          >
            {mainMenu.map(item => (
              <Link key={item.url} href={item.url as Route}>
                {item.title}
              </Link>
            ))}
          </nav>
        </details>
      </div>
      <div className={styles.headerRight}>
        <Cart
          className={styles.cartButton ?? ''}
          icon={
            <Image
              src='/ShoppingBag.svg'
              alt=''
              width={36}
              height={36}
              unoptimized
              className='h-9 w-auto'
            />
          }
        />
      </div>
    </header>
  )
}
