export const SHOPIFY_FILES_CDN_ORIGIN =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files'

export function buildShopifyFilesCdnUrl(fileName: string) {
  if (
    fileName.length === 0 ||
    fileName.includes('/') ||
    fileName.includes('?') ||
    fileName.includes('#')
  ) {
    throw new Error(
      `Shopify Files CDN file name must be a bare file name without query: ${fileName}`
    )
  }

  return `${SHOPIFY_FILES_CDN_ORIGIN}/${encodeURIComponent(fileName)}`
}
