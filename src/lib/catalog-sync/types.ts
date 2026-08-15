export type CatalogSyncWeightUnit = 'g' | 'kg' | 'lb' | 'oz'

export type CatalogMetafieldValue = { value: string }

export type CatalogSyncImage = { url: string }

export type CatalogSyncVariant = {
  id: string
  title: string
  sku: string | null
  barcode: string | null
  price: string
  compareAtPrice: string | null
  inventoryQuantity: number | null
  availableForSale: boolean
  updatedAt: string
  image: { url: string } | null
  selectedOptions: Array<{ name: string; value: string }>
  weight: number | null
  weightUnit: CatalogSyncWeightUnit
  customLabel0: CatalogMetafieldValue | null
  customLabel1: CatalogMetafieldValue | null
  customLabel2: CatalogMetafieldValue | null
  customLabel3: CatalogMetafieldValue | null
  customLabel4: CatalogMetafieldValue | null
}

export type CatalogSyncProduct = {
  id: string
  title: string
  handle: string
  productType: string | null
  descriptionHtml: string
  vendor: string | null
  status: string
  updatedAt: string
  featuredImage: { url: string } | null
  images: CatalogSyncImage[]
  variants: { edges: Array<{ node: CatalogSyncVariant }> }
}
