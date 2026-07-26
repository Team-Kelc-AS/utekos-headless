// Path: src/app/skreddersy-varmen/components/ShippingAndReturnComponent.tsx
'use client'

import Link from 'next/link'
import type { Route } from 'next'
import {
  Truck,
  RefreshCcw,
  CreditCard,
  ArrowRight
} from 'lucide-react'
import { reportLandingSelectPromotion } from '@/app/skreddersy-varmen/utils/reportLandingSelectPromotion'

const pointIconClass =
  'mt-0.5 shrink-0 text-ceramic drop-shadow-sm'
const pointSubtextClass =
  'mt-0.5 text-xs leading-snug text-foreground/85'

export function ShippingAndReturnComponent() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='dark:border-dark-foreground/10 dark:bg-dark-background rounded-xl border border-foreground/10 bg-background text-foreground shadow-sm'>
        <div className='dark:divide-dark-foreground/10 grid grid-cols-1 divide-y divide-foreground/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
          <div className='flex items-start gap-3 p-4'>
            <Truck
              size={22}
              className={pointIconClass}
              aria-hidden
            />
            <div className='min-w-0'>
              <p className='font-utekos-text-medium text-sm text-foreground'>
                Rask levering 2–5 dager
              </p>
              <p className={pointSubtextClass}>
                Sendes samme dag. Fri frakt på denne varen.
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3 p-4'>
            <RefreshCcw
              size={22}
              className={pointIconClass}
              aria-hidden
            />
            <div className='min-w-0'>
              <p className='font-utekos-text-medium text-sm text-foreground'>
                14 dagers åpent kjøp
              </p>
              <p className={pointSubtextClass}>
                Gjelder fra du har mottatt varen
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3 p-4'>
            <CreditCard
              size={22}
              className={pointIconClass}
              aria-hidden
            />
            <div className='min-w-0'>
              <p className='font-utekos-text-medium text-sm text-foreground'>
                Fleksible betalingsmuligheter
              </p>
              <p className={pointSubtextClass}>
                Skreddersy i kassen
              </p>
            </div>
          </div>
        </div>

        <div className='dark:border-dark-foreground/10 dark:bg-dark-background/50 rounded-b-xl border-t border-foreground/10 bg-background/50 px-4 py-2.5'>
          <Link
            href={'/frakt-og-retur' as Route}
            data-track='SkreddersyVarmenFraktOgReturLink'
            onClick={() =>
              reportLandingSelectPromotion('shippingReturns')
            }
            className='group /60 dark:hover:text-dark-accent inline-flex items-center gap-1.5 text-xs font-medium text-foreground/60 transition-colors hover:text-accent'
          >
            Alt om frakt og retur
            <ArrowRight
              size={12}
              className='transition-transform group-hover:translate-x-0.5'
            />
          </Link>
        </div>
      </div>
    </div>
  )
}
