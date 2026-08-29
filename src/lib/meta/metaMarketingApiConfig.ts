import 'server-only'

import { UTEKOS_META_ASSETS } from './metaAssets'

type Environment = Readonly<Record<string, string | undefined>>

export type MetaMarketingApiConfig = {
  accessToken: string
  adAccountId: typeof UTEKOS_META_ASSETS.adAccountId
  appId: typeof UTEKOS_META_ASSETS.appId
  appSecret: string
  businessId: typeof UTEKOS_META_ASSETS.businessId
  catalogId: typeof UTEKOS_META_ASSETS.catalogId
  commerceAccountId: typeof UTEKOS_META_ASSETS.commerceAccountId
  mutationsEnabled: boolean
  pageId: typeof UTEKOS_META_ASSETS.pageId
}

function requiredSecret(
  environment: Environment,
  name: 'META_APP_SECRET' | 'META_SYSTEM_USER_TOKEN'
) {
  const value = environment[name]?.trim()
  if (value) return value

  throw new Error(`meta_marketing_config_missing_${name}`)
}

function pinnedAssetId<
  Name extends keyof typeof UTEKOS_META_ASSETS
>(
  environment: Environment,
  environmentName: string,
  assetName: Name
): (typeof UTEKOS_META_ASSETS)[Name] {
  const expected = UTEKOS_META_ASSETS[assetName]
  const configured = environment[environmentName]?.trim()

  if (
    configured &&
    configured.replace(/^act_/u, '') !== expected
  ) {
    throw new Error(
      `meta_marketing_config_mismatch_${environmentName}`
    )
  }

  return expected
}

export function readMetaMarketingApiConfig(
  environment: Environment = process.env
): MetaMarketingApiConfig {
  return {
    accessToken: requiredSecret(
      environment,
      'META_SYSTEM_USER_TOKEN'
    ),
    adAccountId: pinnedAssetId(
      environment,
      'META_AD_ACCOUNT_ID',
      'adAccountId'
    ),
    appId: pinnedAssetId(environment, 'META_APP_ID', 'appId'),
    appSecret: requiredSecret(environment, 'META_APP_SECRET'),
    businessId: pinnedAssetId(
      environment,
      'META_BUSINESS_ID',
      'businessId'
    ),
    catalogId: pinnedAssetId(
      environment,
      'META_CATALOG_ID',
      'catalogId'
    ),
    commerceAccountId: pinnedAssetId(
      environment,
      'META_COMMERCE_ACCOUNT_ID',
      'commerceAccountId'
    ),
    mutationsEnabled:
      environment.META_MARKETING_API_MUTATIONS_ENABLED ===
      'true',
    pageId: pinnedAssetId(environment, 'META_PAGE_ID', 'pageId')
  }
}
