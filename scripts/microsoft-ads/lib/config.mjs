import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

export const MICROSOFT_ADS_REPO_ROOT = path.resolve(moduleDir, '../../..')
export const MICROSOFT_ADS_OAUTH_SCOPE =
  'https://ads.microsoft.com/msads.manage offline_access'
export const MICROSOFT_ADS_OAUTH_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token'

export const MICROSOFT_ADS_ENVIRONMENTS = Object.freeze({
  production: 'production',
  sandbox: 'sandbox'
})

export const MICROSOFT_UET_CAPI_TOKEN_ENV_KEYS = Object.freeze([
  'MICROSOFT_UET_CAPI_ACCESS_TOKEN',
  'MICROSOFT_UET_CAPI_TOKEN',
  'UTEKOS_MICROSOFT_UET_CAPI_TOKEN',
  'MICROSOFT_ADS_UET_CAPI_TOKEN'
])

export const MICROSOFT_ADS_REQUIRED_FIELDS = Object.freeze([
  'developerToken',
  'clientId',
  'clientSecret',
  'refreshToken',
  'customerId',
  'accountId'
])

const optionalSecretSchema = z.string().trim().min(1).optional()
const optionalIdSchema = z.string().regex(/^\d+$/).optional()

export const microsoftAdsConfigSchema = z
  .object({
    environment: z.enum([
      MICROSOFT_ADS_ENVIRONMENTS.production,
      MICROSOFT_ADS_ENVIRONMENTS.sandbox
    ]),
    developerToken: optionalSecretSchema,
    clientId: optionalSecretSchema,
    clientSecret: optionalSecretSchema,
    accessToken: optionalSecretSchema,
    refreshToken: optionalSecretSchema,
    customerId: optionalIdSchema,
    accountId: optionalIdSchema,
    merchantStoreId: optionalIdSchema,
    uetTagId: optionalIdSchema,
    uetCapiToken: optionalSecretSchema
  })
  .strict()

export function loadMicrosoftAdsConfig({
  processEnv = process.env,
  repoRoot = MICROSOFT_ADS_REPO_ROOT,
  envFiles = ['.env.mcp.local', '.env.local']
} = {}) {
  const fileValues = envFiles.map(file =>
    readEnvFile(path.resolve(repoRoot, file))
  )
  const value = key => readEnvValue(key, processEnv, fileValues)

  const environment = String(
    value('MICROSOFT_ADS_ENVIRONMENT') ??
      MICROSOFT_ADS_ENVIRONMENTS.production
  )
    .trim()
    .toLowerCase()

  return microsoftAdsConfigSchema.parse({
    environment,
    developerToken: optionalValue(value('MICROSOFT_ADS_DEVELOPER_TOKEN')),
    clientId: optionalValue(value('MICROSOFT_ADS_CLIENT_ID')),
    clientSecret: optionalValue(value('MICROSOFT_ADS_CLIENT_SECRET')),
    accessToken: optionalValue(value('MICROSOFT_ADS_ACCESS_TOKEN')),
    refreshToken: optionalValue(value('MICROSOFT_ADS_REFRESH_TOKEN')),
    customerId: normalizeMicrosoftAdsId(
      value('MICROSOFT_ADS_CUSTOMER_ID')
    ),
    accountId: normalizeMicrosoftAdsId(value('MICROSOFT_ADS_ACCOUNT_ID')),
    merchantStoreId: normalizeMicrosoftAdsId(
      value('MICROSOFT_MERCHANT_CENTER_STORE_ID')
    ),
    uetTagId: normalizeMicrosoftAdsId(
      value('MICROSOFT_UET_TAG_ID') ??
        value('NEXT_PUBLIC_MICROSOFT_UET_TAG_ID')
    ),
    uetCapiToken: optionalValue(
      firstDefinedValue(MICROSOFT_UET_CAPI_TOKEN_ENV_KEYS, value)
    )
  })
}

export function getMissingMicrosoftAdsRequirements(
  config,
  requiredFields = MICROSOFT_ADS_REQUIRED_FIELDS
) {
  const parsed = microsoftAdsConfigSchema.parse(config)

  return requiredFields.filter(field => !parsed[field])
}

export function assertMicrosoftAdsRequirements(
  config,
  requiredFields = MICROSOFT_ADS_REQUIRED_FIELDS
) {
  const missing = getMissingMicrosoftAdsRequirements(config, requiredFields)

  if (missing.length > 0) {
    throw new Error(
      `Missing Microsoft Advertising configuration: ${missing.join(', ')}`
    )
  }

  return config
}

export function getSafeMicrosoftAdsConfig(config) {
  const parsed = microsoftAdsConfigSchema.parse(config)

  return {
    environment: parsed.environment,
    customerId: parsed.customerId ?? null,
    accountId: parsed.accountId ?? null,
    merchantStoreId: parsed.merchantStoreId ?? null,
    uetTagId: parsed.uetTagId ?? null,
    credentials: {
      developerTokenPresent: Boolean(parsed.developerToken),
      clientIdPresent: Boolean(parsed.clientId),
      clientSecretPresent: Boolean(parsed.clientSecret),
      accessTokenPresent: Boolean(parsed.accessToken),
      refreshTokenPresent: Boolean(parsed.refreshToken),
      uetCapiTokenPresent: Boolean(parsed.uetCapiToken)
    }
  }
}

export function normalizeMicrosoftAdsId(value) {
  const normalized = optionalValue(value)

  if (!normalized) {
    return undefined
  }

  const compact = normalized.replaceAll('-', '').replaceAll(' ', '')

  if (!/^\d+$/.test(compact)) {
    throw new Error(
      'Microsoft Advertising IDs must contain digits only, optionally formatted with hyphens or spaces.'
    )
  }

  return compact
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return new Map()
  }

  const values = new Map()

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const match = line.match(
      /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/
    )

    if (!match) {
      continue
    }

    values.set(match[1], stripMatchingQuotes(match[2].trim()))
  }

  return values
}

function readEnvValue(key, processEnv, fileValues) {
  const processValue = optionalValue(processEnv?.[key])

  if (processValue) {
    return processValue
  }

  for (const values of fileValues) {
    const fileValue = optionalValue(values.get(key))

    if (fileValue) {
      return fileValue
    }
  }

  return undefined
}

function firstDefinedValue(keys, value) {
  for (const key of keys) {
    const candidate = value(key)

    if (candidate) {
      return candidate
    }
  }

  return undefined
}

function optionalValue(value) {
  if (value === undefined || value === null) {
    return undefined
  }

  const normalized = String(value).trim()

  return normalized || undefined
}

function stripMatchingQuotes(value) {
  if (value.length < 2) {
    return value
  }

  const first = value[0]
  const last = value[value.length - 1]

  return first === last && (first === '"' || first === "'")
    ? value.slice(1, -1)
    : value
}