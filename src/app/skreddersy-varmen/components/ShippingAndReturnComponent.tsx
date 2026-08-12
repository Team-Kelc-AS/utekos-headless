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
  'mt-0.5 shrink-0 text-primary drop-shadow-sm'
export function ShippingAndReturnComponent() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='rounded-xl border border-foreground/10 bg-jungle text-foreground shadow-sm min-[900px]:bg-background'>
        <div className='dark:divide-dark-foreground/10 grid grid-cols-1 divide-y divide-foreground/10 min-[1280px]:grid-cols-3 min-[1280px]:divide-x min-[1280px]:divide-y-0'>
          <div className='flex items-start gap-3 bg-jungle p-4'>
            <Truck
              size={22}
              className={pointIconClass}
              aria-hidden
            />
            <div className='min-w-0'>
              <p className='font-utekos-text-medium text-sm text-foreground'>
                Rask levering 2–5 dager
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3 bg-jungle p-4'>
            <RefreshCcw
              size={22}
              className={pointIconClass}
              aria-hidden
            />
            <div className='min-w-0'>
              <p className='font-utekos-text-medium text-sm text-foreground'>
                14 dagers åpent kjøp
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3 bg-jungle p-4'>
            <CreditCard
              size={22}
              className={pointIconClass}
              aria-hidden
            />
            <div className='min-w-0'>
              <p className='font-utekos-text-medium text-sm text-foreground'>
                Fleksible betalingsmuligheter
              </p>
            </div>
          </div>
        </div>

        <div className='rounded-b-xl border-t border-foreground/10 bg-background px-4 py-2.5 min-[900px]:bg-background/50'>
          <Link
            href={'/frakt-og-retur' as Route}
            data-track='SkreddersyVarmenFraktOgReturLink'
            onClick={() =>
              reportLandingSelectPromotion('shippingReturns')
            }
            className='group inline-flex items-center gap-1.5 text-xs font-medium text-foreground/90 transition-colors hover:text-accent min-[900px]:text-foreground/60'
          >
            Alt om frakt og retur
            <ArrowRight
              size={12}
              className='text-light-teal transition-transform group-hover:translate-x-0.5'
            />
          </Link>
        </div>
      </div>
    </div>
  )
}
