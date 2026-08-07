import 'server-only'

import { z } from 'zod'

import { shopifyAdminGraphql } from './shopifyAdminGraphql'

const DUNVARSEL_TAG = 'dunvarsel'

const dunWaitlistCustomerSchema = z.strictObject({
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().max(100).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional()
})

const shopifyCustomerSchema = z.strictObject({
  id: z.string().regex(/^gid:\/\/shopify\/Customer\/\d+$/)
})

const customerLookupSchema = z.strictObject({
  customer: shopifyCustomerSchema.nullable()
})

const customerCreateSchema = z.strictObject({
  customerCreate: z.strictObject({
    customer: shopifyCustomerSchema.nullable(),
    userErrors: z.array(
      z.strictObject({
        message: z.string()
      })
    )
  })
})

const tagsAddSchema = z.strictObject({
  tagsAdd: z.strictObject({
    node: z
      .strictObject({
        id: z.string()
      })
      .nullable(),
    userErrors: z.array(
      z.strictObject({
        message: z.string()
      })
    )
  })
})

const CUSTOMER_BY_EMAIL_QUERY = `
  query DunWaitlistCustomerByEmail($identifier: CustomerIdentifierInput!) {
    customer: customerByIdentifier(identifier: $identifier) {
      id
    }
  }
`

const CUSTOMER_CREATE_MUTATION = `
  mutation CreateDunWaitlistCustomer($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      userErrors {
        message
      }
    }
  }
`

const TAGS_ADD_MUTATION = `
  mutation AddDunvarselTag($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      node {
        id
      }
      userErrors {
        message
      }
    }
  }
`

export type DunWaitlistCustomer = z.input<
  typeof dunWaitlistCustomerSchema
>

export type ShopifyAdminGraphqlClient = <TData>(
  query: string,
  variables?: Record<string, unknown>
) => Promise<TData>

export type SyncDunWaitlistCustomerDependencies = {
  graphql: ShopifyAdminGraphqlClient
}

const defaultDependencies: SyncDunWaitlistCustomerDependencies = {
  graphql: shopifyAdminGraphql
}

function normalizeNorwegianPhone(
  phone: string | null | undefined
): string | undefined {
  if (!phone) return undefined

  const digits = phone.replace(/\D/g, '')

  if (/^\d{8}$/.test(digits)) {
    return `+47${digits}`
  }

  if (/^47\d{8}$/.test(digits)) {
    return `+${digits}`
  }

  if (/^0047\d{8}$/.test(digits)) {
    return `+${digits.slice(2)}`
  }

  return undefined
}

async function findCustomerIdByEmail(
  email: string,
  graphql: ShopifyAdminGraphqlClient
): Promise<string | null> {
  let response: unknown

  try {
    response = await graphql(CUSTOMER_BY_EMAIL_QUERY, {
      identifier: { emailAddress: email }
    })
  } catch {
    throw new Error('shopify_customer_lookup_failed')
  }

  const parsed = customerLookupSchema.safeParse(response)

  if (!parsed.success) {
    throw new Error('shopify_customer_lookup_invalid_response')
  }

  return parsed.data.customer?.id ?? null
}

async function createCustomer(
  input: {
    email: string
    firstName?: string
    phone?: string
  },
  graphql: ShopifyAdminGraphqlClient
): Promise<string> {
  let response: unknown

  try {
    response = await graphql(CUSTOMER_CREATE_MUTATION, {
      input
    })
  } catch {
    throw new Error('shopify_customer_create_failed')
  }

  const parsed = customerCreateSchema.safeParse(response)

  if (!parsed.success) {
    throw new Error('shopify_customer_create_invalid_response')
  }

  if (
    parsed.data.customerCreate.userErrors.length > 0 ||
    !parsed.data.customerCreate.customer
  ) {
    throw new Error('shopify_customer_create_rejected')
  }

  return parsed.data.customerCreate.customer.id
}

async function resolveCustomerId(
  input: {
    email: string
    firstName?: string
    phone?: string
  },
  graphql: ShopifyAdminGraphqlClient
): Promise<string> {
  const existingCustomerId = await findCustomerIdByEmail(
    input.email,
    graphql
  )

  if (existingCustomerId) {
    return existingCustomerId
  }

  try {
    return await createCustomer(input, graphql)
  } catch (firstCreateError) {
    const racedCustomerId = await findCustomerIdByEmail(
      input.email,
      graphql
    )

    if (racedCustomerId) {
      return racedCustomerId
    }

    if (!input.phone) {
      throw firstCreateError
    }

    try {
      return await createCustomer(
        {
          email: input.email,
          ...(input.firstName ?
            { firstName: input.firstName }
          : {})
        },
        graphql
      )
    } catch (fallbackCreateError) {
      const fallbackRacedCustomerId =
        await findCustomerIdByEmail(input.email, graphql)

      if (fallbackRacedCustomerId) {
        return fallbackRacedCustomerId
      }

      throw fallbackCreateError
    }
  }
}

async function addDunvarselTag(
  customerId: string,
  graphql: ShopifyAdminGraphqlClient
): Promise<void> {
  let response: unknown

  try {
    response = await graphql(TAGS_ADD_MUTATION, {
      id: customerId,
      tags: [DUNVARSEL_TAG]
    })
  } catch {
    throw new Error('shopify_tags_add_failed')
  }

  const parsed = tagsAddSchema.safeParse(response)

  if (!parsed.success) {
    throw new Error('shopify_tags_add_invalid_response')
  }

  if (
    parsed.data.tagsAdd.userErrors.length > 0 ||
    !parsed.data.tagsAdd.node
  ) {
    throw new Error('shopify_tags_add_rejected')
  }
}

export async function syncDunWaitlistCustomerToShopify(
  input: DunWaitlistCustomer,
  dependencies: SyncDunWaitlistCustomerDependencies =
    defaultDependencies
): Promise<{ customerId: string }> {
  const parsed = dunWaitlistCustomerSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error('invalid_waitlist_customer')
  }

  const email = parsed.data.email.toLowerCase()
  const firstName =
    parsed.data.firstName?.trim() || undefined
  const phone = normalizeNorwegianPhone(parsed.data.phone)

  const customerId = await resolveCustomerId(
    {
      email,
      ...(firstName ? { firstName } : {}),
      ...(phone ? { phone } : {})
    },
    dependencies.graphql
  )

  await addDunvarselTag(customerId, dependencies.graphql)

  return { customerId }
}