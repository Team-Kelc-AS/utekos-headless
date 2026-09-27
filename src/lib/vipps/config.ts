import 'server-only'

export type VippsConfig = {
  environment: 'test' | 'production'
  apiBaseUrl: string
  msn: string
  clientId: string
  clientSecret: string
  subscriptionKey: string
}

// Credentials never cross environments, including when configuration is incomplete.
export function getVippsConfig(
  env: Record<string, string | undefined> = process.env
): VippsConfig {
  const environment = env.VIPPS_ENVIRONMENT ?? 'test'
  if (environment !== 'test' && environment !== 'production') {
    throw new Error('Invalid VIPPS_ENVIRONMENT')
  }
  const production = environment === 'production'
  const values =
    production ?
      {
        msn: env.VIPPS_MSN,
        clientId: env.VIPPS_CLIENT_ID,
        clientSecret: env.VIPPS_CLIENT_SECRET,
        subscriptionKey: env.VIPPS_OCP_APIM_PRIMARY
      }
    : {
        msn: env.VIPPS_MSN_TEST,
        clientId: env.VIPPS_TEST_CLIENT_ID,
        clientSecret: env.VIPPS_TEST_CLIENT_SECRET,
        // Existing local name, verified against the test token endpoint.
        subscriptionKey:
          env.VIPPS_TEST_SUBSCRIPTION_KEY ?? env.VIPPS_API_KEY
      }
  for (const value of Object.values(values)) {
    if (!value?.trim())
      throw new Error('Vipps credentials are incomplete')
  }
  if (!/^\d{4,10}$/.test(values.msn!))
    throw new Error('Invalid Vipps MSN')
  return {
    environment,
    apiBaseUrl:
      production ?
        'https://api.vipps.no'
      : 'https://apitest.vipps.no',
    msn: values.msn!,
    clientId: values.clientId!,
    clientSecret: values.clientSecret!,
    subscriptionKey: values.subscriptionKey!
  }
}
