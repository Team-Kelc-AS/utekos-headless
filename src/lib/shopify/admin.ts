// Path: src/lib/shopify/admin.ts
import type {
  CatalogSyncProduct,
  CatalogSyncVariant,
  CatalogSyncWeightUnit
} from '@/lib/catalog-sync/types'
import { getShopifyAdminConfig } from '@/lib/shopify/getShopifyAdminConfig'

const PRODUCT_PAGE_SIZE = 100
const VARIANT_PAGE_SIZE = 250
const CUSTOMER_PAGE_SIZE = 250

type ShopifyWeightUnit =
  | 'KILOGRAMS'
  | 'GRAMS'
  | 'POUNDS'
  | 'OUNCES'
  | string

type ShopifyCatalogSyncVariantNode = {
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
  customLabel0: { value: string } | null
  customLabel1: { value: string } | null
  customLabel2: { value: string } | null
  customLabel3: { value: string } | null
  customLabel4: { value: string } | null
  inventoryItem: {
    measurement: {
      weight: { value: number; unit: ShopifyWeightUnit } | null
    } | null
  } | null
}

type ShopifyCatalogSyncProductNode = {
  id: string
  title: string
  handle: string
  productType: string | null
  descriptionHtml: string
  vendor: string | null
  status: string
  updatedAt: string
  featuredImage: { url: string } | null
  images: { edges: Array<{ node: { url: string } }> }
  variants: {
    edges: Array<{ node: ShopifyCatalogSyncVariantNode }>
  }
}

type ShopifyCatalogSyncQueryResponse = {
  data?: {
    products?: {
      pageInfo: {
        hasNextPage: boolean
        endCursor: string | null
      }
      edges: Array<{ node: ShopifyCatalogSyncProductNode }>
    }
  }
  errors?: unknown
}

type ShopifyCustomerMatchCustomerNode = {
  id: string
  firstName: string | null
  lastName: string | null
  defaultEmailAddress: {
    emailAddress: string
    marketingState: string
  } | null
  defaultPhoneNumber: {
    phoneNumber: string
    marketingState: string
  } | null
}

type ShopifyCustomerMatchQueryResponse = {
  data?: {
    customers?: {
      pageInfo: {
        hasNextPage: boolean
        endCursor: string | null
      }
      edges: Array<{ node: ShopifyCustomerMatchCustomerNode }>
    }
  }
  errors?: unknown
}

export type ShopifyCustomerMatchCustomer = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  emailMarketingSubscribed: boolean
  smsMarketingSubscribed: boolean
}

function mapWeightUnit(
  unit: ShopifyWeightUnit
): CatalogSyncWeightUnit {
  switch (unit) {
    case 'KILOGRAMS':
      return 'kg'
    case 'GRAMS':
      return 'g'
    case 'POUNDS':
      return 'lb'
    case 'OUNCES':
      return 'oz'
    default:
      return 'kg'
  }
}

function mapVariant(
  node: ShopifyCatalogSyncVariantNode
): CatalogSyncVariant {
  const weightData = node.inventoryItem?.measurement?.weight

  return {
    id: node.id,
    title: node.title,
    sku: node.sku,
    barcode: node.barcode,
    price: node.price,
    compareAtPrice: node.compareAtPrice,
    inventoryQuantity: node.inventoryQuantity,
    availableForSale: node.availableForSale,
    updatedAt: node.updatedAt,
    image: node.image,
    selectedOptions: node.selectedOptions,
    weight: weightData?.value || null,
    weightUnit:
      weightData?.unit ? mapWeightUnit(weightData.unit) : 'kg',
    customLabel0: node.customLabel0,
    customLabel1: node.customLabel1,
    customLabel2: node.customLabel2,
    customLabel3: node.customLabel3,
    customLabel4: node.customLabel4
  }
}

function mapProduct(
  node: ShopifyCatalogSyncProductNode
): CatalogSyncProduct {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    productType: node.productType,
    descriptionHtml: node.descriptionHtml,
    vendor: node.vendor,
    status: node.status,
    updatedAt: node.updatedAt,
    featuredImage: node.featuredImage,
    images: node.images.edges.map(edge => ({
      url: edge.node.url
    })),
    variants: {
      edges: node.variants.edges.map(variantEdge => ({
        node: mapVariant(variantEdge.node)
      }))
    }
  }
}

async function fetchCatalogSyncProductPage(
  cursor: string | null
) {
  const { accessToken, graphqlUrl } = getShopifyAdminConfig()
  const query = `
    query getCatalogSyncProducts($cursor: String) {
      products(first: ${PRODUCT_PAGE_SIZE}, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            productType
            descriptionHtml
            vendor
            status
            updatedAt
            featuredImage {
              url
            }
            images(first: 10) {
              edges {
                node {
                  url
                }
              }
            }
            variants(first: ${VARIANT_PAGE_SIZE}) {
              edges {
                node {
                  id
                  title
                  sku
                  barcode
                  price
                  compareAtPrice
                  inventoryQuantity
                  availableForSale
                  updatedAt
                  inventoryItem {
                    measurement {
                      weight {
                        value
                        unit
                      }
                    }
                  }
                  image {
                    url
                  }
                  selectedOptions {
                    name
                    value
                  }
                  customLabel0: metafield(namespace: "mm-google-shopping", key: "custom_label_0") {
                    value
                  }
                  customLabel1: metafield(namespace: "mm-google-shopping", key: "custom_label_1") {
                    value
                  }
                  customLabel2: metafield(namespace: "mm-google-shopping", key: "custom_label_2") {
                    value
                  }
                  customLabel3: metafield(namespace: "mm-google-shopping", key: "custom_label_3") {
                    value
                  }
                  customLabel4: metafield(namespace: "mm-google-shopping", key: "custom_label_4") {
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({ query, variables: { cursor } })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Shopify Admin API Error (${response.status}): ${text}`
    )
  }

  const json =
    (await response.json()) as ShopifyCatalogSyncQueryResponse

  if (json.errors) {
    throw new Error(
      `GraphQL Errors: ${JSON.stringify(json.errors)}`
    )
  }

  const productsConnection = json.data?.products

  if (!productsConnection) {
    return { products: [], nextCursor: null }
  }

  return {
    products: productsConnection.edges.map(edge =>
      mapProduct(edge.node)
    ),
    nextCursor:
      productsConnection.pageInfo.hasNextPage ?
        productsConnection.pageInfo.endCursor
      : null
  }
}

function mapCustomerMatchCustomer(
  node: ShopifyCustomerMatchCustomerNode
): ShopifyCustomerMatchCustomer {
  return {
    id: node.id,
    firstName: node.firstName,
    lastName: node.lastName,
    email:
      node.defaultEmailAddress?.marketingState === 'SUBSCRIBED' ?
        node.defaultEmailAddress.emailAddress
      : null,
    phone:
      node.defaultPhoneNumber?.marketingState === 'SUBSCRIBED' ?
        node.defaultPhoneNumber.phoneNumber
      : null,
    emailMarketingSubscribed:
      node.defaultEmailAddress?.marketingState === 'SUBSCRIBED',
    smsMarketingSubscribed:
      node.defaultPhoneNumber?.marketingState === 'SUBSCRIBED'
  }
}

async function fetchCustomerMatchCustomerPage(
  cursor: string | null
) {
  const { accessToken, graphqlUrl } = getShopifyAdminConfig()
  const query = `
    query getCustomerMatchCustomers($cursor: String) {
      customers(first: ${CUSTOMER_PAGE_SIZE}, after: $cursor, sortKey: UPDATED_AT, reverse: true) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            firstName
            lastName
            defaultEmailAddress {
              emailAddress
              marketingState
            }
            defaultPhoneNumber {
              phoneNumber
              marketingState
            }
          }
        }
      }
    }
  `

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({ query, variables: { cursor } })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Shopify Admin API Error (${response.status}): ${text}`
    )
  }

  const json =
    (await response.json()) as ShopifyCustomerMatchQueryResponse

  if (json.errors) {
    throw new Error(
      `GraphQL Errors: ${JSON.stringify(json.errors)}`
    )
  }

  const customersConnection = json.data?.customers

  if (!customersConnection) {
    return { customers: [], nextCursor: null }
  }

  return {
    customers: customersConnection.edges.map(edge =>
      mapCustomerMatchCustomer(edge.node)
    ),
    nextCursor:
      customersConnection.pageInfo.hasNextPage ?
        customersConnection.pageInfo.endCursor
      : null
  }
}

export async function getAllProductsForCatalogSync(): Promise<
  CatalogSyncProduct[]
> {
  try {
    const products: CatalogSyncProduct[] = []
    let cursor: string | null = null

    while (true) {
      const page = await fetchCatalogSyncProductPage(cursor)
      products.push(...page.products)

      if (!page.nextCursor) {
        return products
      }

      cursor = page.nextCursor
    }
  } catch (error) {
    console.error(
      '[Shopify Admin] Failed to fetch products for catalog sync:',
      error
    )
    throw error
  }
}

export async function getCustomerMatchCustomers(limit = 10000) {
  try {
    const customers: ShopifyCustomerMatchCustomer[] = []
    let cursor: string | null = null

    while (customers.length < limit) {
      const page = await fetchCustomerMatchCustomerPage(cursor)
      const consentedCustomers = page.customers.filter(
        customer => Boolean(customer.email || customer.phone)
      )

      customers.push(...consentedCustomers)

      if (!page.nextCursor) {
        return customers.slice(0, limit)
      }

      cursor = page.nextCursor
    }

    return customers.slice(0, limit)
  } catch (error) {
    console.error(
      '[Shopify Admin] Failed to fetch customers for Customer Match:',
      error
    )
    throw error
  }
}
