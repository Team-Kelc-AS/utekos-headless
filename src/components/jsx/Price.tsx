// Path: src/components/ui/Price.tsx

'use client'

import { formatPrice } from '@/lib/utils/formatPrice'
import type { CurrencyCode } from 'types/commerce/CurrencyCode'
type PriceProps = { amount: string; currencyCode: CurrencyCode }

export function Price({ amount, currencyCode }: PriceProps) {
  return (
    <p className='font-sans font-semibold text-2xl'>
      <span className='sr-only'>Pris:</span>
      {formatPrice({ amount, currencyCode })}
    </p>
  )
}
