export type PinterestConversionsApiConfig = {
  accessToken: string
  adAccountId: string
  enabled: boolean
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `Pinterest Conversions API is enabled but ${name} is missing`
    )
  }
  return value
}

export function getPinterestConversionsApiConfig(): PinterestConversionsApiConfig {
  const enabled =
    process.env.PINTEREST_CONVERSIONS_API_ENABLED === 'true'

  if (!enabled) {
    return { enabled: false, accessToken: '', adAccountId: '' }
  }

  return {
    enabled: true,
    accessToken: requiredEnv(
      'PINTEREST_CONVERSIONS_ACCESS_TOKEN'
    ),
    adAccountId: requiredEnv('PINTEREST_AD_ACCOUNT_ID')
  }
}
