import { z } from 'zod'

import { MICROSOFT_ADS_ENVIRONMENTS } from './config.mjs'
import { requestMicrosoftAdsJson } from './http.mjs'

const merchantIdSchema = z
  .union([
    z.string().trim().regex(/^\d+$/),
    z.number().int().nonnegative()
  ])
  .transform(String)

const productSchema = z.object({}).passthrough()

const productListResponseSchema = z
  .object({
    resources: z
      .array(productSchema)
      .optional()
      .nullable(),
    nextPageToken: z
      .string()
      .optional()
      .nullable()
  })
  .passthrough()

const catalogListResponseSchema = z
  .object({
    catalogs: z
      .array(z.object({}).passthrough())
      .optional()
      .nullable()
  })
  .passthrough()

const productStatusesResponseSchema = z
  .object({
    resources: z
      .array(z.object({}).passthrough())
      .optional()
      .nullable(),
    nextPageToken: z
      .string()
      .optional()
      .nullable()
  })
  .passthrough()

const productStatusesSummarySchema = z
  .object({
    merchantId: z
      .union([z.string(), z.number()])
      .optional(),
    approved: z.number().optional(),
    expiring: z.number().optional(),
    disapproved: z.number().optional(),
    pending: z.number().optional()
  })
  .passthrough()

export function getMicrosoftShoppingContentBaseUrl() {
  return 'https://content.api.bingads.microsoft.com/shopping/v9.1/bmc'
}

export function getMicrosoftShoppingProductStatusBaseUrl() {
  return 'https://content.api.ads.microsoft.com/v9.1/bmc/stores'
}

export function createMicrosoftShoppingContentClient({
  config,
  accessToken,
  fetchImpl = globalThis.fetch,
  timeoutMs = 30_000
}) {
  const baseUrl = getMicrosoftShoppingContentBaseUrl()
  const productStatusBaseUrl =
    getMicrosoftShoppingProductStatusBaseUrl()

  function assertProductionEnvironment() {
    if (
      config?.environment ===
      MICROSOFT_ADS_ENVIRONMENTS.sandbox
    ) {
      throw new Error(
        'Microsoft Shopping Content API does not provide a sandbox endpoint. Use production credentials and dry-run for supported product operations.'
      )
    }
  }

  function resolveMerchantId(
    value = config?.merchantStoreId
  ) {
    return merchantIdSchema.parse(value)
  }

  function createHeaders() {
    const developerToken = requireNonEmptyString(
      config?.developerToken,
      'developerToken'
    )
    const token = requireNonEmptyString(
      accessToken,
      'accessToken'
    )

    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      AuthenticationToken: token,
      DeveloperToken: developerToken,
      ...(config?.customerId && config?.accountId
        ? {
            CustomerId: String(config.customerId),
            CustomerAccountId: String(
              config.accountId
            )
          }
        : {})
    }
  }

  async function rawRequest(
    pathname,
    {
      method = 'GET',
      query,
      body,
      merchantStoreId = config?.merchantStoreId,
      signal,
      betaStatusApi = false
    } = {}
  ) {
    assertProductionEnvironment()

    const merchantId =
      resolveMerchantId(merchantStoreId)
    const relativePath =
      normalizeRelativePath(pathname)

    const root = betaStatusApi
      ? `${productStatusBaseUrl}/${encodeURIComponent(
          merchantId
        )}`
      : `${baseUrl}/${encodeURIComponent(
          merchantId
        )}`

    const url = new URL(
      `${root}${relativePath}`
    )

    appendQuery(url, query)

    return requestMicrosoftAdsJson(
      url.toString(),
      {
        method,
        headers: createHeaders(),
        body,
        fetchImpl,
        timeoutMs,
        signal
      }
    )
  }

  async function listCatalogs(options = {}) {
    const raw = await rawRequest(
      '/catalogs',
      options
    )

    const response =
      catalogListResponseSchema.parse(raw)

    return {
      catalogs: response.catalogs ?? [],
      raw: response
    }
  }

  async function listProducts({
    maxResults = 250,
    startToken,
    merchantStoreId,
    signal
  } = {}) {
    const size = z
      .number()
      .int()
      .min(1)
      .max(250)
      .parse(maxResults)

    const raw = await rawRequest('/products', {
      merchantStoreId,
      signal,
      query: {
        'max-results': size,
        alt: 'json',
        ...(startToken
          ? { 'start-token': startToken }
          : {})
      }
    })

    const response =
      productListResponseSchema.parse(raw)

    return {
      products: response.resources ?? [],
      nextPageToken:
        response.nextPageToken ?? null,
      raw: response
    }
  }

  async function listAllProducts({
    maxResults = 250,
    maxPages = 100,
    merchantStoreId,
    signal
  } = {}) {
    const pageLimit = z
      .number()
      .int()
      .min(1)
      .max(10_000)
      .parse(maxPages)

    const products = []
    let startToken = undefined
    let pages = 0

    while (pages < pageLimit) {
      const page = await listProducts({
        maxResults,
        startToken,
        merchantStoreId,
        signal
      })

      products.push(...page.products)
      pages += 1

      if (!page.nextPageToken) {
        return {
          products,
          pages,
          truncated: false,
          nextPageToken: null
        }
      }

      startToken = page.nextPageToken
    }

    return {
      products,
      pages,
      truncated: true,
      nextPageToken: startToken ?? null
    }
  }

  async function getProduct(
    productId,
    options = {}
  ) {
    const id = requireNonEmptyString(
      productId,
      'productId'
    )

    const raw = await rawRequest(
      `/products/${encodeURIComponent(id)}`,
      {
        ...options,
        query: { alt: 'json' }
      }
    )

    return productSchema.parse(raw)
  }

  async function upsertProduct(
    product,
    {
      catalogId,
      dryRun = false,
      merchantStoreId,
      signal
    } = {}
  ) {
    const parsedProduct =
      productSchema.parse(product)

    return rawRequest('/products', {
      method: 'POST',
      merchantStoreId,
      signal,
      query: {
        alt: 'json',
        ...(catalogId
          ? {
              'bmc-catalog-id':
                String(catalogId)
            }
          : {}),
        ...(dryRun
          ? { 'dry-run': '' }
          : {})
      },
      body: parsedProduct
    })
  }

  async function deleteProduct(
    productId,
    {
      dryRun = false,
      merchantStoreId,
      signal
    } = {}
  ) {
    const id = requireNonEmptyString(
      productId,
      'productId'
    )

    return rawRequest(
      `/products/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        merchantStoreId,
        signal,
        query: {
          alt: 'json',
          ...(dryRun
            ? { 'dry-run': '' }
            : {})
        }
      }
    )
  }

  async function getProductStatusesSummary(
    options = {}
  ) {
    const raw = await rawRequest(
      '/productstatusessummary',
      {
        ...options,
        betaStatusApi: true
      }
    )

    return productStatusesSummarySchema.parse(
      raw
    )
  }

  async function listProductStatuses({
    maxResults = 250,
    continuationToken,
    merchantStoreId,
    signal
  } = {}) {
    const size = z
      .number()
      .int()
      .min(1)
      .max(250)
      .parse(maxResults)

    const raw = await rawRequest(
      '/productstatuses',
      {
        merchantStoreId,
        signal,
        betaStatusApi: true,
        query: {
          'max-results': size,
          ...(continuationToken
            ? {
                'continuation-token':
                  continuationToken
              }
            : {})
        }
      }
    )

    const response =
      productStatusesResponseSchema.parse(raw)

    return {
      statuses: response.resources ?? [],
      nextPageToken:
        response.nextPageToken ?? null,
      raw: response
    }
  }

  async function listAllProductStatuses({
    maxResults = 250,
    maxPages = 100,
    merchantStoreId,
    signal
  } = {}) {
    const pageLimit = z
      .number()
      .int()
      .min(1)
      .max(10_000)
      .parse(maxPages)

    const statuses = []
    let continuationToken = undefined
    let pages = 0

    while (pages < pageLimit) {
      const page =
        await listProductStatuses({
          maxResults,
          continuationToken,
          merchantStoreId,
          signal
        })

      statuses.push(...page.statuses)
      pages += 1

      if (!page.nextPageToken) {
        return {
          statuses,
          pages,
          truncated: false,
          nextPageToken: null
        }
      }

      continuationToken =
        page.nextPageToken
    }

    return {
      statuses,
      pages,
      truncated: true,
      nextPageToken:
        continuationToken ?? null
    }
  }

  return {
    baseUrl,
    productStatusBaseUrl,
    productStatusesAvailability:
      'closed-beta',
    sandboxAvailable: false,
    rawRequest,
    listCatalogs,
    listProducts,
    listAllProducts,
    getProduct,
    upsertProduct,
    deleteProduct,
    getProductStatusesSummary,
    listProductStatuses,
    listAllProductStatuses
  }
}

export function summarizeMicrosoftShoppingProducts(
  products
) {
  const normalized = z
    .array(productSchema)
    .parse(products)

  const byAvailability = {}
  const byTargetCountry = {}
  const byContentLanguage = {}

  let warningCount = 0

  for (const product of normalized) {
    increment(
      byAvailability,
      normalizeText(product.availability) ||
        'unknown'
    )

    increment(
      byTargetCountry,
      normalizeText(product.targetCountry) ||
        'unknown'
    )

    increment(
      byContentLanguage,
      normalizeText(
        product.contentLanguage
      ) || 'unknown'
    )

    warningCount += Array.isArray(
      product.warnings
    )
      ? product.warnings.length
      : 0
  }

  return {
    count: normalized.length,
    inStockCount:
      byAvailability['in stock'] ?? 0,
    outOfStockCount:
      byAvailability['out of stock'] ?? 0,
    preorderCount:
      byAvailability.preorder ?? 0,
    warningCount,
    byAvailability,
    byTargetCountry,
    byContentLanguage
  }
}

function appendQuery(url, query) {
  if (!query) {
    return
  }

  for (const [key, rawValue] of Object.entries(
    query
  )) {
    if (
      rawValue === undefined ||
      rawValue === null ||
      rawValue === false
    ) {
      continue
    }

    if (rawValue === '') {
      url.searchParams.append(key, '')
      continue
    }

    url.searchParams.set(
      key,
      String(rawValue)
    )
  }
}

function normalizeRelativePath(pathname) {
  if (
    typeof pathname !== 'string' ||
    !pathname.trim()
  ) {
    throw new TypeError(
      'Shopping Content pathname must be a non-empty string.'
    )
  }

  const value = pathname.trim()

  if (
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    value.startsWith('//') ||
    value.includes('..')
  ) {
    throw new Error(
      'Shopping Content requests must use a relative API pathname.'
    )
  }

  return value.startsWith('/')
    ? value
    : `/${value}`
}

function requireNonEmptyString(
  value,
  field
) {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      `Microsoft Advertising ${field} is required.`
    )
  }

  return value.trim()
}

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim().toLowerCase()
    : ''
}

function increment(record, key) {
  record[key] = (record[key] ?? 0) + 1
}