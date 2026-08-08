// Path: src/db/config/shopify.config.ts
export const SHOPIFY_STOREFRONT_API_VERSION = '2026-07'

export type ShopifyStorefrontEnvironment = Readonly<{
  [key: string]: string | undefined
  SHOPIFY_STORE_DOMAIN?: string
  SHOPIFY_STOREFRONT_ACCESS_TOKEN?: string
  SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN?: string
}>

export const shopifyConfig = {
  apiVersion: SHOPIFY_STOREFRONT_API_VERSION
}
