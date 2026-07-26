// Path: src/db/config/shopify.config.ts
const SHOPIFY_API_VERSION = '2026-07'
export const shopifyConfig = {
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
  storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  apiVersion: process.env.SHOPIFY_API_VERSION || SHOPIFY_API_VERSION,

  get storefrontApiUrl() {
    if (!this.storeDomain) {
      throw new Error('SHOPIFY_STORE_DOMAIN is not defined')
    }

    const domain = this.storeDomain
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')

    return `https://${domain}/api/${this.apiVersion}/graphql.json`
  },

  validate() {
    const errors: string[] = []

    if (!this.storeDomain) {
      errors.push('SHOPIFY_STORE_DOMAIN is not defined')
    }

    if (!this.storefrontAccessToken) {
      errors.push('SHOPIFY_STOREFRONT_ACCESS_TOKEN is not defined')
    }

    if (errors.length > 0) {
      throw new Error(`Shopify configuration errors:\n${errors.join('\n')}`)
    }

    return true
  }
}
export const getShopifyEndpoint = () => shopifyConfig.storefrontApiUrl

export const getShopifyToken = () => shopifyConfig.storefrontAccessToken
