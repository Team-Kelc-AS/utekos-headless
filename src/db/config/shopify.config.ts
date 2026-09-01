// Path: src/db/config/shopify.config.ts
export const STOREFRONT_API_VERSION = '2026-04'

export type ShopifyStorefrontEnvironment = Readonly<{
  [key: string]: string | undefined
  NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN?: string
  STORE_DOMAIN?: string
  STOREFRONT_PRIVATE_ACCESS_TOKEN?: string
}>

export const shopifyConfig = {
  apiVersion: STOREFRONT_API_VERSION
}
