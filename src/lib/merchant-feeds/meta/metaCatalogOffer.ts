import type { CatalogSyncWeightUnit } from '@/lib/catalog-sync/types'

export type MetaCatalogOfferDisposition =
  | 'published'
  | 'delete'
  | 'excluded'

export type MetaCatalogMediaAsset = {
  url: string
  tags: readonly string[]
}

export type MetaCatalogShipping = {
  country: 'NO'
  price: string
  service: '1-4 days'
}

export type MetaCatalogOffer = {
  id: string
  itemGroupId: string
  title: string
  description: string
  richTextDescription: string
  shortDescription: string
  availability: 'in stock'
  visibility: 'published'
  condition: 'new'
  price: string
  salePrice: string | null
  link: string
  images: readonly MetaCatalogMediaAsset[]
  videos: readonly MetaCatalogMediaAsset[]
  brand: 'Utekos'
  googleProductCategory: string
  facebookProductCategory: string
  productType: string
  gtin: string
  mpn: string
  color: string
  size: string
  gender: 'female' | 'male' | 'unisex'
  ageGroup: 'adult'
  material: string
  shipping: MetaCatalogShipping
  shippingWeightValue: number
  shippingWeightUnit: CatalogSyncWeightUnit
  internalLabels: readonly string[]
  customLabels: readonly [string, string, string, string, string]
  inventoryQuantity: number
  orderingIndex: number
  updatedAtMs: number
}
