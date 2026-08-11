import { productPresentationDefinitions } from './productPresentationDefinitions'
import type { ProductPresentationDefinition } from './productPresentationSchema'

const SITE_ORIGIN = 'https://utekos.no'

const presentationsByPublicHandle = new Map(
  productPresentationDefinitions.map(definition => [
    definition.publicHandle,
    definition
  ])
)

const presentationsByLookupHandle = new Map(
  productPresentationDefinitions.map(definition => [
    definition.storefrontLookupHandle,
    definition
  ])
)

export type ProductPresentation =
  ProductPresentationDefinition & {
    canonicalUrl: string
    productGroupUrl: string
  }

function withDerivedUrls(
  definition: ProductPresentationDefinition
): ProductPresentation {
  const canonicalUrl = `${SITE_ORIGIN}${definition.canonicalPath}`

  return {
    ...definition,
    canonicalUrl,
    productGroupUrl: `${canonicalUrl}#product-group`
  }
}

export function getProductPresentation(
  handle: string
): ProductPresentation | null {
  const normalizedHandle = handle.trim().toLowerCase()
  const definition =
    presentationsByPublicHandle.get(normalizedHandle) ??
    presentationsByLookupHandle.get(normalizedHandle)

  return definition ? withDerivedUrls(definition) : null
}

export function requireProductPresentation(
  handle: string
): ProductPresentation {
  const presentation = getProductPresentation(handle)

  if (!presentation) {
    throw new Error(
      `Missing Utekos product presentation for "${handle}"`
    )
  }

  return presentation
}

export function getAllProductPresentations(): ProductPresentation[] {
  return productPresentationDefinitions.map(withDerivedUrls)
}
