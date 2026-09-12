import 'server-only'

import { cache } from 'react'
import { unstable_rethrow } from 'next/navigation'
import { getProductModel } from '@/lib/products/commerce'

export const resolveSkreddersyVarmenCommerce = cache(
  async () => {
    try {
      return await getProductModel('utekos-techdown')
    } catch (error) {
      unstable_rethrow(error)
      console.error(
        'TechDown commerce data is unavailable on /skreddersy-varmen',
        error
      )
      return null
    }
  }
)
