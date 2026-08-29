import 'server-only'

import { z } from 'zod'

import {
  fetchMetaGraphJson,
  MetaGraphHttpError,
  type MetaGraphFetch
} from './fetchMetaGraphJson'
import {
  META_GRAPH_API_VERSION,
  UTEKOS_META_ASSETS
} from './metaAssets'
import type { MetaMarketingApiConfig } from './metaMarketingApiConfig'

const numericIdSchema = z.string().regex(/^\d+$/u)
const businessReferenceSchema = z
  .object({
    id: numericIdSchema,
    name: z.string().trim().min(1).optional()
  })
  .strip()
const systemUserSchema = z
  .object({
    id: numericIdSchema,
    name: z.string().trim().min(1)
  })
  .strip()
const adAccountSchema = z
  .object({
    account_id: numericIdSchema,
    account_status: z.number().int(),
    business: businessReferenceSchema,
    currency: z.string().trim().min(1),
    id: z.string().regex(/^act_\d+$/u),
    name: z.string().trim().min(1),
    timezone_name: z.string().trim().min(1)
  })
  .strip()
const catalogSchema = z
  .object({
    business: businessReferenceSchema,
    id: numericIdSchema,
    name: z.string().trim().min(1),
    product_count: z.number().int().nonnegative().optional(),
    vertical: z.string().trim().min(1)
  })
  .strip()
const pageSchema = z
  .object({
    id: numericIdSchema,
    name: z.string().trim().min(1)
  })
  .strip()

function graphUrl(id: string, fields: string) {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${id}`
  )
  url.searchParams.set('fields', fields)
  return url
}

function requireEqual(
  actual: string | number,
  expected: string | number,
  code: string
) {
  if (actual !== expected) throw new Error(code)
}

export type MetaMarketingConnectionStatus = {
  adAccount: {
    accountStatus: 1
    currency: typeof UTEKOS_META_ASSETS.currency
    id: typeof UTEKOS_META_ASSETS.adAccountId
    name: string
    timeZone: typeof UTEKOS_META_ASSETS.adAccountTimeZone
  }
  businessId: typeof UTEKOS_META_ASSETS.businessId
  catalog: {
    id: typeof UTEKOS_META_ASSETS.catalogId
    name: string
    productCount?: number
    vertical: string
  }
  checkedAt: string
  graphApiVersion: typeof META_GRAPH_API_VERSION
  mode: 'read_only'
  mutationsEnabled: false
  ok: true
  operationalTimeZone: typeof UTEKOS_META_ASSETS.operationalTimeZone
  page: { id: typeof UTEKOS_META_ASSETS.pageId; name: string }
  systemUser: {
    id: typeof UTEKOS_META_ASSETS.systemUserId
    name: typeof UTEKOS_META_ASSETS.systemUserName
  }
}

export async function verifyMetaMarketingConnection(
  config: MetaMarketingApiConfig,
  options: {
    fetchImplementation?: MetaGraphFetch
    now?: Date
  } = {}
): Promise<MetaMarketingConnectionStatus> {
  if (config.mutationsEnabled) {
    throw new Error(
      'meta_marketing_mutations_must_remain_disabled'
    )
  }

  const request = <Output>(input: {
    schema: { parse: (value: unknown) => Output }
    url: URL
  }) =>
    fetchMetaGraphJson({
      accessToken: config.accessToken,
      appSecret: config.appSecret,
      ...(options.fetchImplementation ?
        { fetchImplementation: options.fetchImplementation }
      : {}),
      schema: input.schema,
      url: input.url
    })

  const systemUser = await request({
    schema: systemUserSchema,
    url: graphUrl('me', 'id,name')
  })
  requireEqual(
    systemUser.id,
    UTEKOS_META_ASSETS.systemUserId,
    'meta_marketing_unexpected_system_user'
  )
  requireEqual(
    systemUser.name,
    UTEKOS_META_ASSETS.systemUserName,
    'meta_marketing_unexpected_system_user'
  )

  const [adAccount, catalog, page] = await Promise.all([
    request({
      schema: adAccountSchema,
      url: graphUrl(
        `act_${config.adAccountId}`,
        'id,account_id,name,account_status,currency,timezone_name,business'
      )
    }),
    request({
      schema: catalogSchema,
      url: graphUrl(
        config.catalogId,
        'id,name,business,vertical,product_count'
      )
    }),
    request({
      schema: pageSchema,
      url: graphUrl(config.pageId, 'id,name')
    })
  ])

  requireEqual(
    adAccount.id,
    `act_${UTEKOS_META_ASSETS.adAccountId}`,
    'meta_marketing_unexpected_ad_account'
  )
  requireEqual(
    adAccount.account_id,
    UTEKOS_META_ASSETS.adAccountId,
    'meta_marketing_unexpected_ad_account'
  )
  requireEqual(
    adAccount.business.id,
    config.businessId,
    'meta_marketing_ad_account_business_mismatch'
  )
  requireEqual(
    adAccount.account_status,
    1,
    'meta_marketing_ad_account_not_active'
  )
  requireEqual(
    adAccount.currency,
    UTEKOS_META_ASSETS.currency,
    'meta_marketing_ad_account_currency_mismatch'
  )
  requireEqual(
    adAccount.timezone_name,
    UTEKOS_META_ASSETS.adAccountTimeZone,
    'meta_marketing_ad_account_timezone_mismatch'
  )
  requireEqual(
    catalog.id,
    config.catalogId,
    'meta_marketing_unexpected_catalog'
  )
  requireEqual(
    catalog.business.id,
    config.businessId,
    'meta_marketing_catalog_business_mismatch'
  )
  requireEqual(
    page.id,
    config.pageId,
    'meta_marketing_unexpected_page'
  )

  return {
    adAccount: {
      accountStatus: 1,
      currency: UTEKOS_META_ASSETS.currency,
      id: UTEKOS_META_ASSETS.adAccountId,
      name: adAccount.name,
      timeZone: UTEKOS_META_ASSETS.adAccountTimeZone
    },
    businessId: UTEKOS_META_ASSETS.businessId,
    catalog: {
      id: UTEKOS_META_ASSETS.catalogId,
      name: catalog.name,
      ...(catalog.product_count === undefined ?
        {}
      : { productCount: catalog.product_count }),
      vertical: catalog.vertical
    },
    checkedAt: (options.now ?? new Date()).toISOString(),
    graphApiVersion: META_GRAPH_API_VERSION,
    mode: 'read_only',
    mutationsEnabled: false,
    ok: true,
    operationalTimeZone: UTEKOS_META_ASSETS.operationalTimeZone,
    page: { id: UTEKOS_META_ASSETS.pageId, name: page.name },
    systemUser: {
      id: UTEKOS_META_ASSETS.systemUserId,
      name: UTEKOS_META_ASSETS.systemUserName
    }
  }
}

export function describeMetaMarketingConnectionError(
  error: unknown
) {
  if (error instanceof MetaGraphHttpError) {
    return {
      code: 'meta_graph_rejected',
      httpStatus: error.status,
      ...(error.code === undefined ?
        {}
      : { providerCode: error.code }),
      ...(error.errorSubcode === undefined ?
        {}
      : { providerSubcode: error.errorSubcode }),
      ...(error.isTransient === undefined ?
        {}
      : { transient: error.isTransient })
    }
  }

  if (error instanceof z.ZodError) {
    return { code: 'meta_graph_contract_mismatch' }
  }

  if (
    error instanceof Error &&
    /^meta_marketing_[A-Za-z0-9_]+$/u.test(error.message)
  ) {
    return { code: error.message }
  }

  return { code: 'meta_marketing_connection_failed' }
}
