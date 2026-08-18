import { z } from 'zod'

const moneyBagSchema = z.object({
  shopMoney: z.object({
    amount: z.string(),
    currencyCode: z.string()
  }),
  presentmentMoney: z.object({
    amount: z.string(),
    currencyCode: z.string()
  })
})

const pageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  endCursor: z.string().nullable()
})

const addressSchema = z
  .object({
    city: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    provinceCode: z.string().nullable().optional(),
    zip: z.string().nullable().optional(),
    countryCodeV2: z.string().nullable().optional()
  })
  .nullable()
  .optional()

const discountApplicationSchema = z.object({
  allocationMethod: z.string(),
  targetType: z.string(),
  targetSelection: z.string().optional(),
  code: z.string().nullable().optional(),
  title: z.string().nullable().optional()
})

const lineItemNodeSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  quantity: z.number().int(),
  sku: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  product: z
    .object({ vendor: z.string(), productType: z.string() })
    .nullable()
    .optional(),
  variant: z
    .object({ id: z.string(), legacyResourceId: z.string() })
    .nullable()
    .optional(),
  originalUnitPriceSet: moneyBagSchema,
  taxLines: z.array(
    z.object({ rate: z.number(), priceSet: moneyBagSchema })
  ),
  discountAllocations: z.array(
    z.object({
      allocatedAmountSet: moneyBagSchema,
      discountApplication: z.object({
        allocationMethod: z.string(),
        targetType: z.string()
      })
    })
  )
})

const refundLineItemNodeSchema = z.object({
  id: z.string(),
  quantity: z.number().int(),
  subtotalSet: moneyBagSchema,
  lineItem: z.object({
    id: z.string(),
    name: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    variant: z
      .object({ id: z.string(), legacyResourceId: z.string() })
      .nullable()
      .optional(),
    originalUnitPriceSet: moneyBagSchema
  })
})

const refundTransactionNodeSchema = z.object({
  id: z.string(),
  amountSet: moneyBagSchema,
  status: z.string().nullable().optional(),
  kind: z.string().nullable().optional(),
  gateway: z.string().nullable().optional(),
  createdAt: z.string(),
  order: z
    .object({ legacyResourceId: z.string() })
    .nullable()
    .optional()
})

export const shopifyCommerceReconciliationRefundSchema =
  z.object({
    id: z.string(),
    legacyResourceId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable().optional(),
    totalRefundedSet: moneyBagSchema,
    refundLineItems: z.object({
      pageInfo: pageInfoSchema,
      nodes: z.array(refundLineItemNodeSchema)
    }),
    transactions: z.object({
      pageInfo: pageInfoSchema,
      nodes: z.array(refundTransactionNodeSchema)
    })
  })

export const shopifyCommerceReconciliationOrderSchema = z.object(
  {
    id: z.string(),
    legacyResourceId: z.string(),
    name: z.string().nullable().optional(),
    createdAt: z.string(),
    processedAt: z.string().nullable().optional(),
    updatedAt: z.string(),
    displayFinancialStatus: z.string().nullable().optional(),
    currencyCode: z.string(),
    presentmentCurrencyCode: z.string().nullable().optional(),
    taxesIncluded: z.boolean(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    clientIp: z.string().nullable().optional(),
    statusPageUrl: z.string().nullable().optional(),
    customAttributes: z.array(
      z.object({
        key: z.string(),
        value: z.string().nullable().optional()
      })
    ),
    totalPriceSet: moneyBagSchema,
    totalTaxSet: moneyBagSchema,
    totalShippingPriceSet: moneyBagSchema,
    discountCodes: z.array(z.string()).nullable().optional(),
    discountApplications: z.object({
      pageInfo: pageInfoSchema,
      nodes: z.array(discountApplicationSchema)
    }),
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    customer: z
      .object({
        id: z.string(),
        legacyResourceId: z.string(),
        defaultEmailAddress: z
          .object({
            emailAddress: z.string().nullable().optional()
          })
          .nullable()
          .optional(),
        defaultPhoneNumber: z
          .object({
            phoneNumber: z.string().nullable().optional()
          })
          .nullable()
          .optional()
      })
      .nullable()
      .optional(),
    customerJourneySummary: z
      .object({
        firstVisit: z
          .object({
            landingPage: z.string().nullable().optional(),
            referrerUrl: z.string().nullable().optional()
          })
          .nullable()
          .optional()
      })
      .nullable()
      .optional(),
    lineItems: z.object({
      pageInfo: pageInfoSchema,
      nodes: z.array(lineItemNodeSchema)
    }),
    refunds: z.array(shopifyCommerceReconciliationRefundSchema)
  }
)

export const shopifyCommerceReconciliationOrdersPageSchema =
  z.object({
    orders: z.object({
      pageInfo: pageInfoSchema,
      nodes: z.array(shopifyCommerceReconciliationOrderSchema)
    })
  })

export type ShopifyCommerceReconciliationMoneyBag = z.infer<
  typeof moneyBagSchema
>

export type ShopifyCommerceReconciliationOrder = z.infer<
  typeof shopifyCommerceReconciliationOrderSchema
>

export type ShopifyCommerceReconciliationRefund = z.infer<
  typeof shopifyCommerceReconciliationRefundSchema
>

export type ShopifyCommerceReconciliationOrdersPage = z.infer<
  typeof shopifyCommerceReconciliationOrdersPageSchema
>

export const SHOPIFY_COMMERCE_RECONCILIATION_QUERY = `#graphql
query ShopifyCommerceReconciliation(
  $first: Int!
  $after: String
  $query: String!
) {
  orders(
    first: $first
    after: $after
    sortKey: UPDATED_AT
    reverse: false
    query: $query
  ) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      legacyResourceId
      name
      createdAt
      processedAt
      updatedAt
      displayFinancialStatus
      currencyCode
      presentmentCurrencyCode
      taxesIncluded
      email
      phone
      clientIp
      statusPageUrl
      customAttributes {
        key
        value
      }
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
        presentmentMoney {
          amount
          currencyCode
        }
      }
      totalTaxSet {
        shopMoney {
          amount
          currencyCode
        }
        presentmentMoney {
          amount
          currencyCode
        }
      }
      totalShippingPriceSet {
        shopMoney {
          amount
          currencyCode
        }
        presentmentMoney {
          amount
          currencyCode
        }
      }
      discountCodes
      discountApplications(first: 50) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          allocationMethod
          targetType
          targetSelection
          ... on DiscountCodeApplication {
            code
          }
          ... on AutomaticDiscountApplication {
            title
          }
          ... on ManualDiscountApplication {
            title
          }
        }
      }
      shippingAddress {
        city
        phone
        provinceCode
        zip
        countryCodeV2
      }
      billingAddress {
        city
        phone
        provinceCode
        zip
        countryCodeV2
      }
      customer {
        id
        legacyResourceId
        defaultEmailAddress {
          emailAddress
        }
        defaultPhoneNumber {
          phoneNumber
        }
      }
      customerJourneySummary {
        firstVisit {
          landingPage
          referrerUrl
        }
      }
      lineItems(first: 250) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          name
          title
          quantity
          sku
          vendor
          product {
            vendor
            productType
          }
          variant {
            id
            legacyResourceId
          }
          originalUnitPriceSet {
            shopMoney {
              amount
              currencyCode
            }
            presentmentMoney {
              amount
              currencyCode
            }
          }
          taxLines {
            rate
            priceSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
          }
          discountAllocations {
            allocatedAmountSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            discountApplication {
              allocationMethod
              targetType
            }
          }
        }
      }
      refunds(first: 250) {
        id
        legacyResourceId
        createdAt
        updatedAt
        totalRefundedSet {
          shopMoney {
            amount
            currencyCode
          }
          presentmentMoney {
            amount
            currencyCode
          }
        }
        refundLineItems(first: 250) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            quantity
            subtotalSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            lineItem {
              id
              name
              title
              sku
              variant {
                id
                legacyResourceId
              }
              originalUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
        transactions(first: 50) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            amountSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            status
            kind
            gateway
            createdAt
            order {
              legacyResourceId
            }
          }
        }
      }
    }
  }
}`
