import 'server-only'

import { cache } from 'react'
import { getTechDownCommerceViewModel } from '@/lib/products/commerce'

export const resolveSkreddersyVarmenCommerce = cache(
  async () => {
    try {
      return await getTechDownCommerceViewModel()
    } catch (error) {
      console.error(
        'TechDown commerce data is unavailable on /skreddersy-varmen',
        error
      )
      return null
    }
  }
)
