// src/app/produkter/[handle]/utils/generateProductStaticParams.ts

import { getProducts } from '@/api/lib/products/getProducts'
import { getAllProductPresentations } from '@/lib/products/presentation'

export type ProductStaticParam = { handle: string }

type GenerateProductStaticParamsDependencies = {
  fetchProducts?: typeof getProducts
}

function getPresentationParams(): ProductStaticParam[] {
  return getAllProductPresentations().map(presentation => ({
    handle: presentation.publicHandle
  }))
}

export async function generateProductStaticParams(
  dependencies: GenerateProductStaticParamsDependencies = {}
): Promise<ProductStaticParam[]> {
  const fallbackParams = getPresentationParams()
  let response: Awaited<ReturnType<typeof getProducts>>

  try {
    response = await (dependencies.fetchProducts ?? getProducts)(
      { first: 250 }
    )
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'pdp.static_params.served_presentation_fallback',
        level: 'WARN',
        error:
          error instanceof Error ? error.message : String(error),
        context: { count: fallbackParams.length }
      })
    )
    return fallbackParams
  }

  if (!response.success || !response.body) {
    console.warn(
      JSON.stringify({
        event: 'pdp.static_params.served_presentation_fallback',
        level: 'WARN',
        error: 'Shopify returned no product catalog',
        context: { count: fallbackParams.length }
      })
    )
    return fallbackParams
  }

  const liveLookupHandles = new Set(
    response.body
      .map(product => product.handle?.trim())
      .filter((handle): handle is string => Boolean(handle))
  )
  const params = getAllProductPresentations()
    .filter(presentation =>
      liveLookupHandles.has(presentation.storefrontLookupHandle)
    )
    .map(presentation => ({ handle: presentation.publicHandle }))

  if (params.length === 0) {
    return fallbackParams
  }

  return params
}
