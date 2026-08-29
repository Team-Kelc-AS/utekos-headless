import 'server-only'

import { parseIntegrationHealthSnapshot } from './integrationHealthSnapshot'
import type { IntegrationHealthSnapshot } from './integrationHealthSnapshot'

type Environment = Readonly<Record<string, string | undefined>>

type ConfigurationDefinition = Readonly<{
  enabledBy?: string
  integration: string
  requiredGroups: readonly (readonly string[])[]
  surface: string
}>

const CONFIGURATION_DEFINITIONS: readonly ConfigurationDefinition[] = [
  {
    integration: 'sentry',
    requiredGroups: [
      ['SENTRY_DSN', 'NEXT_PUBLIC_SENTRY_DSN']
    ],
    surface: 'error_ingestion'
  },
  {
    integration: 'ga4',
    requiredGroups: [
      ['NEXT_PUBLIC_GA_MEASUREMENT_ID'],
      ['GOOGLE_ANALYTICS_PROPERTY_ID']
    ],
    surface: 'browser_and_reporting'
  },
  {
    integration: 'google_data_manager',
    requiredGroups: [
      ['GOOGLE_ANALYTICS_PROPERTY_ID'],
      ['GCP_PROJECT_ID'],
      ['GCP_SERVICE_ACCOUNT_EMAIL'],
      ['GCP_AUDIENCE']
    ],
    surface: 'server_ingestion'
  },
  {
    integration: 'meta',
    requiredGroups: [
      ['META_PIXEL_ID', 'NEXT_PUBLIC_META_PIXEL_ID'],
      ['META_ACCESS_TOKEN']
    ],
    surface: 'pixel_and_direct_capi'
  },
  {
    integration: 'microsoft',
    requiredGroups: [
      [
        'MICROSOFT_UET_TAG_ID',
        'UTEKOS_MICROSOFT_TAG_ID',
        'NEXT_PUBLIC_MICROSOFT_UET_TAG_ID'
      ],
      [
        'MICROSOFT_UET_CAPI_ACCESS_TOKEN',
        'MICROSOFT_UET_CAPI_TOKEN',
        'UTEKOS_MICROSOFT_UET_CAPI_TOKEN',
        'MICROSOFT_ADS_UET_CAPI_TOKEN'
      ]
    ],
    surface: 'uet_and_conversions_api'
  },
  {
    enabledBy: 'PINTEREST_CONVERSIONS_API_ENABLED',
    integration: 'pinterest',
    requiredGroups: [
      ['NEXT_PUBLIC_PINTEREST_TAG_ID'],
      ['PINTEREST_CONVERSIONS_ACCESS_TOKEN']
    ],
    surface: 'tag_and_conversions_api'
  },
  {
    enabledBy: 'SNAPCHAT_CONVERSIONS_API_ENABLED',
    integration: 'snapchat',
    requiredGroups: [
      ['SNAPCHAT_PIXEL_ID', 'NEXT_PUBLIC_SNAPCHAT_PIXEL_ID'],
      ['SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN'],
      ['SNAPCHAT_CONVERSIONS_API_CUTOVER_AT']
    ],
    surface: 'pixel_and_conversions_api'
  },
  {
    integration: 'shopify',
    requiredGroups: [
      ['VERCEL_SHOPIFY_STORE_DOMAIN'],
      [
        'STOREFRONT_API_PRIVATE_ACCESS_TOKEN',
        'PRIVATE_STOREFRONT_API_TOKEN',
        'STOREFRONT_PRIVATE_ACCESS_TOKEN'
      ]
    ],
    surface: 'private_storefront_gateway'
  },
  {
    integration: 'supabase',
    requiredGroups: [
      [
        'SUPABASE_VERCEL_POSTGRES_URL',
        'SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING'
      ]
    ],
    surface: 'canonical_ledger_connection'
  },
  {
    enabledBy: 'LAUNCH_GUARD_SMS_ENABLED',
    integration: 'twilio',
    requiredGroups: [
      ['TWILIO_ALERT_ACCOUNT_SID'],
      ['TWILIO_ALERT_AUTH_TOKEN'],
      [
        'TWILIO_ALERT_MESSAGING_SERVICE_SID',
        'TWILIO_ALERT_FROM_E164'
      ],
      ['TWILIO_ALERT_TO_E164'],
      ['TWILIO_ALERT_STATUS_CALLBACK_ORIGIN']
    ],
    surface: 'critical_sms'
  },
  {
    enabledBy: 'CUSTOMER_ASSISTANT_ENABLED',
    integration: 'customer_assistant',
    requiredGroups: [
      ['CUSTOMER_ASSISTANT_ROLLOUT_PERCENT'],
      ['UPSTASH_REDIS_REST_URL'],
      ['UPSTASH_REDIS_REST_TOKEN'],
      ['CUSTOMER_ASSISTANT_RATE_LIMIT_SECRET'],
      ['CUSTOMER_ASSISTANT_FEEDBACK_SECRET'],
      [
        'SUPABASE_VERCEL_POSTGRES_URL',
        'SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING'
      ]
    ],
    surface: 'staged_customer_chat'
  }
]

const DOCUMENTED_BUT_REQUIRES_PROVIDER_READBACK = [
  ['clarity', 'gtm_recording_export'],
  ['signals_gateway', 'gcp_gateway_dataset'],
  ['google_search_console', 'search_console_api'],
  ['shopify_analytics', 'analytics_readback']
] as const

function hasValue(environment: Environment, key: string) {
  return Boolean(environment[key]?.trim())
}

function configurationSnapshot(
  definition: ConfigurationDefinition,
  environment: Environment,
  checkedAt: string,
  runId: string
): IntegrationHealthSnapshot {
  const explicitlyDisabled =
    definition.enabledBy !== undefined &&
    environment[definition.enabledBy] !== 'true'
  const complete = definition.requiredGroups.every(group =>
    group.some(key => hasValue(environment, key))
  )
  const configured = !explicitlyDisabled && complete

  return parseIntegrationHealthSnapshot({
    runId,
    integration: definition.integration,
    surface: definition.surface,
    status: configured ? 'healthy' : 'not_configured',
    severity: configured ? 'info' : 'low',
    checkedAt,
    sampleCount: definition.requiredGroups.length,
    errorCount: 0,
    evidenceLevel: 'configuration',
    providerReceiptStatus: 'not_checked',
    resultCode:
      configured ?
        'required_configuration_present'
      : explicitlyDisabled ?
        'integration_explicitly_disabled'
      : 'required_configuration_incomplete',
    measurements: {
      configured,
      explicitly_disabled: explicitlyDisabled,
      required_group_count: definition.requiredGroups.length
    }
  })
}

export function readIntegrationConfigurationHealth(input: {
  environment: Environment
  now: () => Date
  runId: string
}) {
  const checkedAt = input.now().toISOString()
  const configured = CONFIGURATION_DEFINITIONS.map(definition =>
    configurationSnapshot(
      definition,
      input.environment,
      checkedAt,
      input.runId
    )
  )
  const requiresReadback =
    DOCUMENTED_BUT_REQUIRES_PROVIDER_READBACK.map(
      ([integration, surface]) =>
        parseIntegrationHealthSnapshot({
          runId: input.runId,
          integration,
          surface,
          status: 'unknown',
          severity: 'low',
          checkedAt,
          sampleCount: 0,
          errorCount: 0,
          evidenceLevel: 'configuration',
          providerReceiptStatus: 'not_checked',
          resultCode: 'provider_readback_required',
          measurements: {}
        })
    )

  return [...configured, ...requiresReadback]
}

export const INTEGRATION_CONFIGURATION_SURFACES = [
  ...CONFIGURATION_DEFINITIONS.map(
    definition =>
      `${definition.integration}:${definition.surface}`
  ),
  ...DOCUMENTED_BUT_REQUIRES_PROVIDER_READBACK.map(
    ([integration, surface]) => `${integration}:${surface}`
  )
]
