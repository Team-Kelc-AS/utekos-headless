#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { randomUUID } from 'node:crypto'

import { McpServer, StdioServerTransport } from '@modelcontextprotocol/server'
import { z } from 'zod/v4'

const repoRoot = path.resolve(process.env.UTEKOS_REPO_ROOT ?? process.cwd())
const profile = 'utekos_chatgpt_shopify_readonly'
const mode = 'live-read-protected-data'
const defaultApiVersion = '2026-04'

const canonicalTools = [
  'shopify_readonly_bootstrap',
  'shopify_access_scope_status',
  'shopify_orders_query',
  'shopify_customers_query'
]

const requiredScopes = ['read_orders', 'read_all_orders', 'read_customers']

const currentAccessScopesQuery = `query CurrentAccessScopes {
  currentAppInstallation {
    accessScopes {
      handle
    }
  }
}`

const ordersQuery = `query Orders($first: Int!, $after: String, $query: String, $reverse: Boolean!) {
  orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: $reverse) {
    nodes {
      id
      name
      createdAt
      updatedAt
      displayFinancialStatus
      displayFulfillmentStatus
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`

const customersQuery = `query Customers($first: Int!, $after: String, $query: String!, $reverse: Boolean!, $includeContact: Boolean!) {
  customers(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: $reverse) {
    nodes {
      id
      createdAt
      updatedAt
      amountSpent {
        amount
        currencyCode
      }
      numberOfOrders
      firstName @include(if: $includeContact)
      lastName @include(if: $includeContact)
      defaultEmailAddress @include(if: $includeContact) {
        emailAddress
      }
      defaultPhoneNumber @include(if: $includeContact) {
        phoneNumber
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`

const sourceSchema = z.object({
  label: z.string(),
  url: z.string().optional(),
  path: z.string().optional()
})

const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  user_action_required: z.boolean(),
  suggested_fix: z.string(),
  details_redacted: z.boolean()
})

const permissionsSchema = z.object({
  read_only: z.literal(true),
  provider_mutation: z.literal(false),
  secrets_redacted: z.literal(true),
  protected_customer_data_possible: z.boolean()
})

function envelopeSchema(toolName) {
  return z.object({
    ok: z.boolean(),
    tool: z.literal(toolName),
    profile: z.literal(profile),
    mode: z.literal(mode),
    request_id: z.string(),
    generated_at: z.string(),
    data: z.record(z.string(), z.unknown()),
    sources: z.array(sourceSchema),
    warnings: z.array(z.string()),
    errors: z.array(errorSchema),
    limits: z.record(z.string(), z.unknown()),
    permissions: permissionsSchema,
    next: z.array(z.string())
  })
}

function readEnvValues(relativePath) {
  const filePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(filePath)) return new Map()
  const values = new Map()

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const raw = match[2].trim()
    const value =
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith('\u0027') && raw.endsWith('\u0027'))
        ? raw.slice(1, -1)
        : raw
    values.set(match[1], value)
  }

  return values
}

const localEnv = new Map([
  ...readEnvValues('.env.local'),
  ...readEnvValues('.env.mcp.local')
])

function secretEnvValue(key) {
  return process.env[key]?.trim() || localEnv.get(key)?.trim() || ''
}

function normalizeShopDomain(value) {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
    .toLowerCase()
}

function config() {
  const shop = normalizeShopDomain(secretEnvValue('SHOPIFY_CHATGPT_STORE_DOMAIN'))
  const apiVersion = secretEnvValue('SHOPIFY_CHATGPT_API_VERSION') || defaultApiVersion
  const errors = []

  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) {
    errors.push('SHOPIFY_CHATGPT_STORE_DOMAIN')
  }
  if (!secretEnvValue('SHOPIFY_CHATGPT_CLIENT_ID')) errors.push('SHOPIFY_CHATGPT_CLIENT_ID')
  if (!secretEnvValue('SHOPIFY_CHATGPT_CLIENT_SECRET')) errors.push('SHOPIFY_CHATGPT_CLIENT_SECRET')
  if (!/^\d{4}-(01|04|07|10)$/.test(apiVersion)) errors.push('SHOPIFY_CHATGPT_API_VERSION')

  return {
    shop,
    apiVersion,
    clientId: secretEnvValue('SHOPIFY_CHATGPT_CLIENT_ID'),
    clientSecret: secretEnvValue('SHOPIFY_CHATGPT_CLIENT_SECRET'),
    missingOrInvalid: errors
  }
}

let cachedToken = ''
let cachedTokenExpiresAt = 0

async function accessToken() {
  const current = config()
  if (current.missingOrInvalid.length > 0) {
    const error = new Error('Dedicated Shopify ChatGPT client credentials are missing or invalid.')
    error.code = 'SHOPIFY_CREDENTIALS_NOT_READY'
    error.missingOrInvalid = current.missingOrInvalid
    throw error
  }

  if (cachedToken && Date.now() < cachedTokenExpiresAt - 60_000) return cachedToken

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: current.clientId,
    client_secret: current.clientSecret
  })
  const response = await fetch(`https://${current.shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || typeof payload.access_token !== 'string') {
    const error = new Error(`Shopify token exchange failed with HTTP ${response.status}.`)
    error.code = 'SHOPIFY_TOKEN_EXCHANGE_FAILED'
    throw error
  }

  cachedToken = payload.access_token
  const expiresIn = Number(payload.expires_in)
  cachedTokenExpiresAt = Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 86_400) * 1000
  return cachedToken
}

async function shopifyGraphql(query, variables) {
  const current = config()
  const token = await accessToken()
  const response = await fetch(`https://${current.shop}/admin/api/${current.apiVersion}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({ query, variables })
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || (Array.isArray(payload.errors) && payload.errors.length > 0)) {
    const firstMessage = payload.errors?.[0]?.message
    const error = new Error(firstMessage || `Shopify GraphQL failed with HTTP ${response.status}.`)
    error.code = response.status === 401 || response.status === 403 ? 'SHOPIFY_ACCESS_DENIED' : 'SHOPIFY_GRAPHQL_FAILED'
    throw error
  }

  return payload.data
}

function makeError(error) {
  const credentialError = error?.code === 'SHOPIFY_CREDENTIALS_NOT_READY'
  return {
    code: error?.code || 'SHOPIFY_READ_FAILED',
    message: credentialError
      ? 'Dedicated Shopify ChatGPT credentials are not ready.'
      : 'Shopify rejected or could not complete the read request.',
    user_action_required: credentialError || error?.code === 'SHOPIFY_ACCESS_DENIED',
    suggested_fix: credentialError
      ? 'Set the dedicated SHOPIFY_CHATGPT_* values in .env.mcp.local. Do not reuse SHOPIFY_ADMIN_API_TOKEN.'
      : 'Verify the dedicated app scopes, protected customer data approval, store domain, and client credentials.',
    details_redacted: true
  }
}

function envelope(tool, data, options = {}) {
  return {
    ok: options.ok ?? true,
    tool,
    profile,
    mode,
    request_id: randomUUID(),
    generated_at: new Date().toISOString(),
    data,
    sources: options.sources ?? [],
    warnings: options.warnings ?? [],
    errors: options.errors ?? [],
    limits: options.limits ?? {},
    permissions: {
      read_only: true,
      provider_mutation: false,
      secrets_redacted: true,
      protected_customer_data_possible: options.protectedCustomerDataPossible ?? false
    },
    next: options.next ?? []
  }
}

function textResult(value, summary) {
  return {
    content: [{ type: 'text', text: summary }],
    structuredContent: value
  }
}

function failureResult(tool, error, data = {}) {
  const value = envelope(tool, data, {
    ok: false,
    errors: [makeError(error)],
    next: ['Call shopify_access_scope_status after configuring the dedicated app credentials.']
  })
  return textResult(value, `${tool} failed closed. ${value.errors[0].suggested_fix}`)
}

const inspectAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true
}

const liveReadAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: true,
  idempotentHint: true
}

const server = new McpServer({
  name: 'utekos-shopify-readonly',
  version: '1.0.0'
})

server.registerTool(
  'shopify_readonly_bootstrap',
  {
    title: 'Shopify Read Only Bootstrap',
    description: 'Use first. Returns the dedicated read-only policy, bounded tool surface, protected-customer-data rules, and required scopes. Does not contact Shopify.',
    inputSchema: z.object({}),
    outputSchema: envelopeSchema('shopify_readonly_bootstrap'),
    annotations: inspectAnnotations
  },
  async () => {
    const current = config()
    const value = envelope('shopify_readonly_bootstrap', {
      canonical_tools: canonicalTools,
      required_scopes: requiredScopes,
      credential_keys: [
        'SHOPIFY_CHATGPT_STORE_DOMAIN',
        'SHOPIFY_CHATGPT_CLIENT_ID',
        'SHOPIFY_CHATGPT_CLIENT_SECRET',
        'SHOPIFY_CHATGPT_API_VERSION'
      ],
      credentials_ready: current.missingOrInvalid.length === 0,
      policy: {
        dedicated_credentials_only: true,
        broad_admin_token_fallback: false,
        max_orders_per_call: 50,
        max_customers_per_call: 25,
        customer_search_required: true,
        customer_contact_default: 'excluded',
        mutations: 'not_exposed'
      }
    }, {
      sources: [
        { label: 'Shopify access scopes', url: 'https://shopify.dev/docs/api/usage/access-scopes' },
        { label: 'Shopify protected customer data', url: 'https://shopify.dev/docs/apps/launch/protected-customer-data' }
      ],
      warnings: current.missingOrInvalid.length > 0 ? ['Dedicated credentials are not configured; live tools will fail closed.'] : [],
      next: ['Call shopify_access_scope_status before querying orders or customers.']
    })
    return textResult(value, 'Dedicated Shopify read-only surface ready; live readiness is reported in structuredContent.')
  }
)

server.registerTool(
  'shopify_access_scope_status',
  {
    title: 'Shopify Access Scope Status',
    description: 'Checks the dedicated app token and returns only granted scope names and readiness for read_orders, read_all_orders, and read_customers. Never returns credentials.',
    inputSchema: z.object({}),
    outputSchema: envelopeSchema('shopify_access_scope_status'),
    annotations: liveReadAnnotations
  },
  async () => {
    try {
      const data = await shopifyGraphql(currentAccessScopesQuery, {})
      const granted = (data.currentAppInstallation?.accessScopes ?? []).map(item => item.handle).sort()
      const status = Object.fromEntries(requiredScopes.map(scope => [scope, granted.includes(scope)]))
      const value = envelope('shopify_access_scope_status', {
        granted_scopes: granted,
        required_scope_status: status,
        orders_recent_ready: status.read_orders,
        orders_older_than_60_days_ready: status.read_orders && status.read_all_orders,
        customers_ready: status.read_customers
      }, {
        sources: [{ label: 'Shopify access scopes', url: 'https://shopify.dev/docs/api/usage/access-scopes' }],
        warnings: requiredScopes.filter(scope => !status[scope]).map(scope => `Missing scope: ${scope}`),
        next: status.read_orders && status.read_all_orders && status.read_customers
          ? ['Use bounded order or customer queries.']
          : ['Update the dedicated app scopes and reinstall/release the app before claiming full readiness.']
      })
      return textResult(value, 'Shopify dedicated app scope status returned without credential values.')
    } catch (error) {
      return failureResult('shopify_access_scope_status', error, { granted_scopes: [], required_scope_status: {} })
    }
  }
)

server.registerTool(
  'shopify_orders_query',
  {
    title: 'Shopify Orders Query',
    description: 'Returns a bounded page of newest orders without customer contact, addresses, notes, line items, or payment details. Use Shopify search syntax in query; read_all_orders is required for records older than 60 days.',
    inputSchema: z.object({
      first: z.number().int().min(1).max(50).default(20),
      after: z.string().min(1).max(1024).optional(),
      query: z.string().min(2).max(300).optional(),
      reverse: z.boolean().default(true)
    }),
    outputSchema: envelopeSchema('shopify_orders_query'),
    annotations: liveReadAnnotations
  },
  async ({ first, after, query, reverse }) => {
    try {
      const data = await shopifyGraphql(ordersQuery, { first, after, query, reverse })
      const value = envelope('shopify_orders_query', {
        orders: data.orders.nodes,
        page_info: data.orders.pageInfo,
        returned_count: data.orders.nodes.length
      }, {
        limits: { max_per_call: 50, returned: data.orders.nodes.length },
        sources: [{ label: 'Shopify Order API', url: 'https://shopify.dev/docs/api/admin-graphql/latest/objects/Order' }],
        next: data.orders.pageInfo.hasNextPage ? ['Pass page_info.endCursor as after for the next bounded page.'] : []
      })
      return textResult(value, `Returned ${data.orders.nodes.length} bounded order records without customer contact data.`)
    } catch (error) {
      return failureResult('shopify_orders_query', error, { orders: [], page_info: null, returned_count: 0 })
    }
  }
)

const customerInputSchema = z.object({
  query: z.string().min(2).max(160),
  first: z.number().int().min(1).max(25).default(10),
  after: z.string().min(1).max(1024).optional(),
  reverse: z.boolean().default(true),
  include_contact: z.boolean().default(false),
  purpose: z.enum(['customer_service', 'order_support', 'account_verification']).optional()
}).superRefine((value, context) => {
  if (value.include_contact && !value.purpose) {
    context.addIssue({
      code: 'custom',
      path: ['purpose'],
      message: 'purpose is required when include_contact is true'
    })
  }
})

server.registerTool(
  'shopify_customers_query',
  {
    title: 'Shopify Customers Query',
    description: 'Searches a bounded customer page. A non-empty search is mandatory. Names, email, and phone are excluded by default; include_contact=true requires an explicit support purpose and should only follow an explicit user request.',
    inputSchema: customerInputSchema,
    outputSchema: envelopeSchema('shopify_customers_query'),
    annotations: liveReadAnnotations
  },
  async ({ query, first, after, reverse, include_contact, purpose }) => {
    try {
      const data = await shopifyGraphql(customersQuery, {
        query,
        first,
        after,
        reverse,
        includeContact: include_contact
      })
      console.error(JSON.stringify({
        event: 'shopify_customer_read',
        timestamp: new Date().toISOString(),
        include_contact,
        purpose: purpose ?? null,
        returned_count: data.customers.nodes.length
      }))
      const value = envelope('shopify_customers_query', {
        customers: data.customers.nodes,
        page_info: data.customers.pageInfo,
        returned_count: data.customers.nodes.length,
        contact_included: include_contact,
        purpose: purpose ?? null
      }, {
        protectedCustomerDataPossible: include_contact,
        limits: { max_per_call: 25, returned: data.customers.nodes.length, search_required: true },
        sources: [
          { label: 'Shopify Customer API', url: 'https://shopify.dev/docs/api/admin-graphql/latest/objects/Customer' },
          { label: 'Shopify protected customer data', url: 'https://shopify.dev/docs/apps/launch/protected-customer-data' }
        ],
        warnings: include_contact ? ['Protected customer contact data was included for the declared purpose.'] : [],
        next: data.customers.pageInfo.hasNextPage ? ['Pass page_info.endCursor as after for the next bounded page.'] : []
      })
      return textResult(value, `Returned ${data.customers.nodes.length} bounded customer records; contact data ${include_contact ? 'included' : 'excluded'}.`)
    } catch (error) {
      return failureResult('shopify_customers_query', error, { customers: [], page_info: null, returned_count: 0, contact_included: false })
    }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Utekos Shopify Read Only MCP server running on stdio')
}

main().catch(error => {
  console.error(error instanceof Error ? error.stack : String(error))
  process.exit(1)
})
