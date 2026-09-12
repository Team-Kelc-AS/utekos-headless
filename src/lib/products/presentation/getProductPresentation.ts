import { productPresentationDefinitions } from './productPresentationDefinitions'
import type { ProductPresentationDefinition } from './productPresentationSchema'

export type ProductPresentation =
  ProductPresentationDefinition & {
    canonicalPath: string
    canonicalUrl: string
    productGroupUrl: string
  }

const presentations: ProductPresentation[] =
  productPresentationDefinitions.map(definition => {
    const canonicalPath = `/produkter/${definition.publicHandle}`
    const canonicalUrl = `https://utekos.no${canonicalPath}`
    return {
      ...definition,
      canonicalPath,
      canonicalUrl,
      productGroupUrl: `${canonicalUrl}#product-group`
    }
  })
const presentationsByHandle = new Map(
  presentations.map(presentation => [
    presentation.publicHandle,
    presentation
  ])
)

export function getProductPresentation(
  handle: string
): ProductPresentation | null {
  return (
    presentationsByHandle.get(handle.trim().toLowerCase()) ??
    null
  )
}

export function requireProductPresentation(
  handle: string
): ProductPresentation {
  const presentation = getProductPresentation(handle)
  if (!presentation)
    throw new Error(
      `Missing Utekos product presentation for "${handle}"`
    )
  return presentation
}

export function getAllProductPresentations(): ProductPresentation[] {
  return [...presentations]
}
