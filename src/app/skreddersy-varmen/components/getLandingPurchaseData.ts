'use server'

import { z } from 'zod'
import { resolveSkreddersyVarmenCommerce } from '../data/resolveSkreddersyVarmenCommerce'
import { requireProductPresentation } from '@/lib/products/presentation/getProductPresentation'

export async function getLandingPurchaseData(variantId: string) {
  const requestedVariant = z.string().max(200).parse(variantId)
  const commerce = await resolveSkreddersyVarmenCommerce()
  if (!commerce)
    throw new Error(
      'Produktvalgene er midlertidig utilgjengelige'
    )
  return {
    commerce,
    presentation: requireProductPresentation(commerce.handle),
    initialVariantId:
      commerce.variants.find(
        variant => variant.id === requestedVariant
      )?.id ?? commerce.defaultVariantId
  }
}
