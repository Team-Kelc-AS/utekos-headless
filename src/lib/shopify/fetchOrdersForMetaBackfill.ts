import type { OrderPaid } from 'types/commerce/order/OrderPaid'

const API_VERSION = '2026-07'
const ORDER_PAGE_SIZE = 50

type ShopifyMailingAddress = {
  firstName: string | null
  lastName: string | null
  city: string | null
  provinceCode: string | null
  zip: string | null
  countryCodeV2: string | null
  phone: string | null
}

type ShopifyBackfillOrderNode = {
  id: string
  createdAt: string
  processedAt: string | null
  updatedAt: string
  email: string | null
  phone: string | null
  clientIp: string | null
  statusPageUrl: string
  displayFinancialStatus: string | null
  totalPriceSet: {
    shopMoney: {
      amount: string
      currencyCode: string
    }
  }
  customAttributes: Array<{
    key: string
    value: string | null
  }>
  shippingAddress: ShopifyMailingAddress | null
  billingAddress: ShopifyMailingAddress | null
  customer: {
    id: string
    email: string | null
    phone: string | null
    defaultAddress: ShopifyMailingAddress | null
  } | null
  lineItems: {
    nodes: Array<{
      title: string
      quantity: number
      currentQuantity: number
      originalUnitPriceSet: {
        shopMoney: {
          amount: string
        }
      }
      variant: {
        id: string
      } | null
      product: {
        id: string
      } | null
    }>
  }
}

type ShopifyBackfillOrdersResponse = {
  data?: {
    orders?: {
      pageInfo: {
        hasNextPage: boolean
        endCursor: string | null
      }
      nodes: ShopifyBackfillOrderNode[]
    }
  }
  errors?: unknown
}

type FetchOrdersForMetaBackfillInput = {
  from: Date
  to: Date
}

function resolveShopifyGraphqlUrl(): string {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN

  if (!storeDomain) {
    throw new Error('Missing SHOPIFY_STORE_DOMAIN')
  }

  return `https://${storeDomain}/admin/api/${API_VERSION}/graphql.json`
}

function resolveShopifyAdminToken(): string {
  const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN

  if (!adminToken) {
    throw new Error('Missing SHOPIFY_ADMIN_API_TOKEN')
  }

  return adminToken
}

function parseLegacyResourceId(gid: string | null | undefined): number | null {
  if (!gid) {
    return null
  }

  const segments = gid.split('/')
  const numericSegment = segments[segments.length - 1]
  const parsedId = Number.parseInt(numericSegment || '', 10)

  return Number.isNaN(parsedId) ? null : parsedId
}

function mapAddress(address: ShopifyMailingAddress | null) {
  if (!address) {
    return null
  }

  return {
    first_name: address.firstName,
    last_name: address.lastName,
    city: address.city,
    province_code: address.provinceCode,
    zip: address.zip,
    country_code: address.countryCodeV2,
    phone: address.phone
  }
}

function mapOrder(node: ShopifyBackfillOrderNode): OrderPaid {
  const orderId = parseLegacyResourceId(node.id) || 0
  const lineItems = node.lineItems.nodes
    .filter(lineItem => (lineItem.currentQuantity || lineItem.quantity) > 0)
    .map(lineItem => ({
      product_id: parseLegacyResourceId(lineItem.product?.id),
      quantity:
        lineItem.currentQuantity > 0 ? lineItem.currentQuantity : lineItem.quantity,
      title: lineItem.title,
      price: lineItem.originalUnitPriceSet.shopMoney.amount,
      variant_id: parseLegacyResourceId(lineItem.variant?.id)
    }))

  return {
    id: orderId,
    admin_graphql_api_id: node.id,
    browser_ip: node.clientIp,
    client_details: null,
    contact_email: node.email,
    created_at: node.createdAt,
    currency: node.totalPriceSet.shopMoney.currencyCode,
    current_total_price: node.totalPriceSet.shopMoney.amount,
    email: node.email,
    financial_status: node.displayFinancialStatus?.toLowerCase() || null,
    note_attributes: node.customAttributes.map(attribute => ({
      name: attribute.key,
      value: attribute.value || ''
    })),
    order_status_url: node.statusPageUrl,
    phone: node.phone,
    processed_at: node.processedAt,
    total_price: node.totalPriceSet.shopMoney.amount,
    updated_at: node.updatedAt,
    user_id: null,
    billing_address: mapAddress(node.billingAddress),
    customer:
      node.customer ?
        {
          id: parseLegacyResourceId(node.customer.id),
          email: node.customer.email,
          phone: node.customer.phone,
          default_address: mapAddress(node.customer.defaultAddress)
        }
      : null,
    line_items: lineItems,
    shipping_address: mapAddress(node.shippingAddress)
  } as OrderPaid
}

async function fetchOrdersPage(cursor: string | null) {
  const query = `
    query MetaBackfillOrders($cursor: String) {
      orders(
        first: ${ORDER_PAGE_SIZE}
        after: $cursor
        sortKey: PROCESSED_AT
        reverse: true
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          createdAt
          processedAt
          updatedAt
          email
          phone
          clientIp
          statusPageUrl
          displayFinancialStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          customAttributes {
            key
            value
          }
          shippingAddress {
            firstName
            lastName
            city
            provinceCode
            zip
            countryCodeV2
            phone
          }
          billingAddress {
            firstName
            lastName
            city
            provinceCode
            zip
            countryCodeV2
            phone
          }
          customer {
            id
            email
            phone
            defaultAddress {
              firstName
              lastName
              city
              provinceCode
              zip
              countryCodeV2
              phone
            }
          }
          lineItems(first: 250) {
            nodes {
              title
              quantity
              currentQuantity
              originalUnitPriceSet {
                shopMoney {
                  amount
                }
              }
              variant {
                id
              }
              product {
                id
              }
            }
          }
        }
      }
    }
  `

  const response = await fetch(resolveShopifyGraphqlUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': resolveShopifyAdminToken()
    },
    body: JSON.stringify({
      query,
      variables: {
        cursor
      }
    })
  })

  if (!response.ok) {
    const responseText = await response.text()
    throw new Error(`Shopify Admin API Error (${response.status}): ${responseText}`)
  }

  const json = (await response.json()) as ShopifyBackfillOrdersResponse

  if (json.errors) {
    throw new Error(`Shopify GraphQL Errors: ${JSON.stringify(json.errors)}`)
  }

  return json.data?.orders || null
}

export async function fetchOrdersForMetaBackfill({
  from,
  to
}: FetchOrdersForMetaBackfillInput): Promise<OrderPaid[]> {
  const fromTime = from.getTime()
  const toTime = to.getTime()
  const orders: OrderPaid[] = []
  let cursor: string | null = null

  while (true) {
    const page = await fetchOrdersPage(cursor)

    if (!page) {
      return orders
    }

    let reachedOrdersOlderThanWindow = false

    for (const node of page.nodes) {
      const processedTimestamp = Date.parse(node.processedAt || node.createdAt)

      if (Number.isNaN(processedTimestamp)) {
        continue
      }

      if (processedTimestamp > toTime) {
        continue
      }

      if (processedTimestamp < fromTime) {
        reachedOrdersOlderThanWindow = true
        continue
      }

      if (node.displayFinancialStatus !== 'PAID') {
        continue
      }

      orders.push(mapOrder(node))
    }

    if (reachedOrdersOlderThanWindow || !page.pageInfo.hasNextPage) {
      return orders
    }

    cursor = page.pageInfo.endCursor
  }
}
