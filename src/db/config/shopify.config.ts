// Path: src/db/config/shopify.config.ts
export const STOREFRONT_API_VERSION = '2026-04'

export type ShopifyStorefrontEnvironment = Readonly<{
  [key: string]: string | undefined
  VERCEL_SHOPIFY_STORE_DOMAIN?: string
  VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN?: string
  STORE_DOMAIN?: string
  STOREFRONT_API_ACCESS_TOKEN?: string
}>

export const shopifyConfig = {
  apiVersion: STOREFRONT_API_VERSION
}
