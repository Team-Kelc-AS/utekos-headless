import { z } from 'zod'
import type { StorefrontMoney } from '@/api/shopify/types/storefrontApi'
import type { Money } from 'types/commerce/Money'

const moneySchema = z.object({
  amount: z.string(),
  currencyCode: z.enum(['NOK', 'EUR', 'USD', 'GBP', 'SEK', 'DKK'])
})

export function normalizeStorefrontMoney(money: StorefrontMoney): Money {
  return moneySchema.parse(money)
}
