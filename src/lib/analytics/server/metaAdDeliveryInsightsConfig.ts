type Environment = Readonly<Record<string, string | undefined>>

export type MetaAdDeliveryInsightsConfig = {
  accessToken: string
  accountId: string
}

function requiredEnvironmentValue(
  environment: Environment,
  name: string
) {
  const value = environment[name]?.trim()
  if (value) return value

  throw new Error(
    `Missing required Meta delivery insights configuration: ${name}`
  )
}

export function readMetaAdDeliveryInsightsConfig(
  environment: Environment = process.env
): MetaAdDeliveryInsightsConfig {
  const rawAccountId = requiredEnvironmentValue(
    environment,
    'META_AD_ACCOUNT_ID'
  )
  const accountId = rawAccountId.replace(/^act_/, '')

  if (!/^\d+$/.test(accountId)) {
    throw new Error('META_AD_ACCOUNT_ID must contain digits only')
  }

  return {
    accessToken: requiredEnvironmentValue(
      environment,
      'META_SYSTEM_USER_TOKEN'
    ),
    accountId
  }
}
