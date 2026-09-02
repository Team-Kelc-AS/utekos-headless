import {
  canonicalSignalNames,
  type CanonicalEventSignalPolicy,
  type CanonicalSignalRule,
  type CanonicalSignalSource,
  type CanonicalSignalUnavailableReason,
  type ProviderSignalDeliveryPolicy
} from './canonicalSignalContract'

export type EventSignalProfile =
  | 'website'
  | 'server_mutation'
  | 'transaction_attribution'
  | 'meta_non_web'
  | 'blocked_browser'
  | 'blocked_mixed'

function signalRule(
  requirement: CanonicalSignalRule['requirement'],
  allowedSources: readonly CanonicalSignalSource[],
  allowedUnavailableReasons: readonly CanonicalSignalUnavailableReason[]
): CanonicalSignalRule {
  return {
    requirement,
    allowedSources,
    allowedUnavailableReasons
  }
}

const noClickReasons = [
  'consent_denied',
  'no_applicable_click',
  'not_observed',
  'expired'
] as const

const marketingUnavailableReasons = [
  'consent_denied',
  'not_observed',
  'expired'
] as const

const requestSources = [
  'browser_request_url',
  'browser_document',
  'server_request'
] as const

const requestDeviceSources = [
  'vercel_request_context',
  'server_request'
] as const

const transactionSources = [
  'checkout_attribution_snapshot',
  'shopify_order_attribute'
] as const

const websiteSignals = {
  event_source_url: signalRule('required', requestSources, [
    'untrusted_source'
  ]),
  client_ip_address: signalRule(
    'required_when_marketing_granted',
    requestDeviceSources,
    marketingUnavailableReasons
  ),
  client_user_agent: signalRule(
    'required_when_marketing_granted',
    requestDeviceSources,
    marketingUnavailableReasons
  ),
  external_id: signalRule(
    'required_when_marketing_granted',
    [
      'first_party_external_id_cookie',
      'checkout_attribution_snapshot'
    ],
    marketingUnavailableReasons
  ),
  click_ids: signalRule(
    'required_when_observed',
    [
      'browser_request_url',
      'durable_click_id_store',
      'checkout_attribution_snapshot'
    ],
    noClickReasons
  ),
  meta_fbclid: signalRule(
    'required_when_observed',
    [
      'browser_request_url',
      'durable_click_id_store',
      'checkout_attribution_snapshot'
    ],
    noClickReasons
  ),
  meta_fbc: signalRule(
    'required_when_observed',
    [
      'first_party_cookie',
      'meta_parameter_builder',
      'checkout_attribution_snapshot'
    ],
    noClickReasons
  ),
  meta_fbp: signalRule(
    'required_when_marketing_granted',
    [
      'first_party_cookie',
      'meta_parameter_builder',
      'checkout_attribution_snapshot'
    ],
    marketingUnavailableReasons
  )
} as const satisfies CanonicalEventSignalPolicy

const serverMutationSignals = {
  ...websiteSignals,
  event_source_url: signalRule(
    'required',
    [
      'browser_document',
      'browser_request_url',
      'server_request'
    ],
    ['untrusted_source']
  ),
  client_ip_address: signalRule(
    'required_when_marketing_granted',
    ['server_request', 'vercel_request_context'],
    marketingUnavailableReasons
  ),
  client_user_agent: signalRule(
    'required_when_marketing_granted',
    ['server_request', 'vercel_request_context'],
    marketingUnavailableReasons
  )
} as const satisfies CanonicalEventSignalPolicy

const transactionAttributionSignals = Object.fromEntries(
  canonicalSignalNames.map(signal => [
    signal,
    signalRule(
      'required_from_attribution_snapshot',
      transactionSources,
      (
        signal === 'click_ids' ||
          signal === 'meta_fbclid' ||
          signal === 'meta_fbc'
      ) ?
        ['consent_denied', 'no_applicable_click']
      : signal === 'event_source_url' ? []
      : ['consent_denied']
    )
  ])
) as CanonicalEventSignalPolicy

const blockedBrowserSignals =
  websiteSignals satisfies CanonicalEventSignalPolicy

const blockedMixedSignals =
  serverMutationSignals satisfies CanonicalEventSignalPolicy

const metaNonWebSignals = Object.fromEntries(
  canonicalSignalNames.map(signal => [
    signal,
    signalRule('not_applicable', [], ['not_applicable'])
  ])
) as CanonicalEventSignalPolicy

export const eventSignalPolicies = {
  website: websiteSignals,
  server_mutation: serverMutationSignals,
  transaction_attribution: transactionAttributionSignals,
  meta_non_web: metaNonWebSignals,
  blocked_browser: blockedBrowserSignals,
  blocked_mixed: blockedMixedSignals
} as const satisfies Readonly<
  Record<EventSignalProfile, CanonicalEventSignalPolicy>
>

export function attachEventSignalContracts<
  TCatalog extends Readonly<Record<string, object>>,
  TProfiles extends {
    readonly [K in keyof TCatalog]: EventSignalProfile
  }
>(
  catalog: TCatalog,
  profiles: TProfiles
): {
  readonly [K in keyof TCatalog]: TCatalog[K] & {
    signals: CanonicalEventSignalPolicy
  }
} {
  return Object.fromEntries(
    Object.entries(catalog).map(([eventName, entry]) => [
      eventName,
      {
        ...entry,
        signals:
          eventSignalPolicies[
            profiles[eventName as keyof TCatalog]
          ]
      }
    ])
  ) as {
    readonly [K in keyof TCatalog]: TCatalog[K] & {
      signals: CanonicalEventSignalPolicy
    }
  }
}

const notApplicableProviderSignals = Object.fromEntries(
  canonicalSignalNames.map(signal => [signal, 'not_applicable'])
) as ProviderSignalDeliveryPolicy

const firstPartyPersistenceSignals = Object.fromEntries(
  canonicalSignalNames.map(signal => [
    signal,
    'persist_canonical'
  ])
) as ProviderSignalDeliveryPolicy

const googleSignals = {
  event_source_url: 'send_when_supported_and_permitted',
  client_ip_address: 'send_when_supported_and_permitted',
  client_user_agent: 'send_when_available',
  external_id: 'send_when_supported_and_permitted',
  click_ids: 'send_when_supported_and_permitted',
  meta_fbclid: 'not_applicable',
  meta_fbc: 'not_applicable',
  meta_fbp: 'not_applicable'
} as const satisfies ProviderSignalDeliveryPolicy

const metaSignals = {
  event_source_url: 'required',
  client_ip_address: 'send_when_available',
  client_user_agent: 'send_when_available',
  external_id: 'send_when_available',
  click_ids: 'not_applicable',
  meta_fbclid: 'derive_to_provider_format',
  meta_fbc: 'send_when_available',
  meta_fbp: 'send_when_available'
} as const satisfies ProviderSignalDeliveryPolicy

const metaNonWebProviderSignals = {
  event_source_url: 'not_applicable',
  client_ip_address: 'send_when_available',
  client_user_agent: 'send_when_available',
  external_id: 'send_when_available',
  click_ids: 'not_applicable',
  meta_fbclid: 'not_applicable',
  meta_fbc: 'send_when_available',
  meta_fbp: 'send_when_available'
} as const satisfies ProviderSignalDeliveryPolicy

const microsoftSignals = {
  event_source_url: 'required',
  client_ip_address: 'send_when_available',
  client_user_agent: 'send_when_available',
  external_id: 'send_when_available',
  click_ids: 'send_when_available',
  meta_fbclid: 'not_applicable',
  meta_fbc: 'not_applicable',
  meta_fbp: 'not_applicable'
} as const satisfies ProviderSignalDeliveryPolicy

const pinterestSignals = {
  event_source_url: 'required',
  client_ip_address: 'send_when_available',
  client_user_agent: 'send_when_available',
  external_id: 'send_when_available',
  click_ids: 'send_when_available',
  meta_fbclid: 'not_applicable',
  meta_fbc: 'not_applicable',
  meta_fbp: 'not_applicable'
} as const satisfies ProviderSignalDeliveryPolicy

const snapchatSignals = {
  event_source_url: 'required',
  client_ip_address: 'send_when_available',
  client_user_agent: 'send_when_available',
  external_id: 'send_when_available',
  click_ids: 'send_when_available',
  meta_fbclid: 'not_applicable',
  meta_fbc: 'not_applicable',
  meta_fbp: 'not_applicable'
} as const satisfies ProviderSignalDeliveryPolicy

type ProviderTransportInput = Readonly<{
  browser: string | null
  server: string | null
}>

export function resolveProviderSignalDelivery(
  transport: ProviderTransportInput
): ProviderSignalDeliveryPolicy {
  if (transport.server === 'first_party_api') {
    return firstPartyPersistenceSignals
  }

  if (
    transport.server === 'meta_conversions_api_app' ||
    transport.server === 'meta_conversions_api_offline'
  ) {
    return metaNonWebProviderSignals
  }

  if (
    transport.server === 'meta_conversions_api' ||
    transport.browser === 'meta_pixel'
  ) {
    return metaSignals
  }

  if (
    transport.server === 'microsoft_uet_capi' ||
    transport.browser === 'microsoft_uet'
  ) {
    return microsoftSignals
  }

  if (
    transport.server === 'pinterest_conversions_api' ||
    transport.browser === 'pinterest_tag'
  ) {
    return pinterestSignals
  }

  if (
    transport.server === 'snap_conversions_api_v3' ||
    transport.browser === 'snap_pixel'
  ) {
    return snapchatSignals
  }

  if (
    transport.server === 'google_data_manager' ||
    transport.server === 'server_side_gtm' ||
    transport.browser === 'google_tag_manager'
  ) {
    return googleSignals
  }

  return notApplicableProviderSignals
}
