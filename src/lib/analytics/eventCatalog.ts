import type {
  CanonicalEventSignalPolicy,
  ProviderSignalDeliveryPolicy
} from './canonicalSignalContract'
import {
  attachEventSignalContracts,
  resolveProviderSignalDelivery,
  type EventSignalProfile
} from './eventCatalogSignalContracts'

export type CatalogLifecycle =
  | 'active'
  | 'planned'
  | 'blocked_source'

export type ProviderId =
  | 'supabase'
  | 'google'
  | 'meta'
  | 'microsoft_uet'
  | 'pinterest'
  | 'snapchat'

export type ServerOutboxStatus =
  | 'active'
  | 'disabled'
  | 'blocked_no_worker'

type ProviderSupport =
  | 'supported'
  | 'planned'
  | 'not_relevant'
  | 'blocked'

type ProviderProductionStatus =
  | 'active'
  | 'planned'
  | 'blocked'
  | 'not_implemented'
  | 'not_relevant'

type BrowserTransport =
  | 'google_tag_manager'
  | 'shopify_customer_events'
  | 'meta_pixel'
  | 'microsoft_uet'
  | 'pinterest_tag'
  | 'snap_pixel'

type ServerTransport =
  | 'first_party_api'
  | 'server_side_gtm'
  | 'google_data_manager'
  | 'meta_conversions_api'
  | 'meta_conversions_api_app'
  | 'meta_conversions_api_offline'
  | 'microsoft_uet_capi'
  | 'pinterest_conversions_api'
  | 'snap_conversions_api_v3'

type ProviderConsentRequirement =
  | 'analytics'
  | 'marketing'
  | 'analytics_or_marketing'
  | 'analytics_or_operational'
  | 'operational'
  | 'none'

type ProviderCatalogEntry = {
  support: ProviderSupport
  eventName: string | null
  transport: {
    browser: BrowserTransport | null
    server: ServerTransport | null
  }
  requiredParameters: readonly string[]
  dedupeField: string | null
  consentRequirement: ProviderConsentRequirement
  adapterVersion: number | null
  productionStatus: ProviderProductionStatus
  productionDetail: string
  serverOutbox: ServerOutboxStatus
  signalDelivery: ProviderSignalDeliveryPolicy
}

type ConsentBasis = 'analytics' | 'marketing' | 'operational'

type EventConsentPolicy = {
  browserCreation:
    | 'local_ephemeral_allowed'
    | 'after_authoritative_response'
    | 'authoritative_server_source'
  firstPartyCollection: readonly ConsentBasis[]
  canonicalLedger: readonly ConsentBasis[]
  analyticsExport: readonly ['analytics']
  marketingExport: readonly ['marketing'] | readonly []
  googleCookielessPing:
    | 'allowed_by_consent_mode'
    | 'not_applicable'
  operationalPurpose:
    | 'none'
    | 'commerce_mutation'
    | 'order_accounting'
    | 'lead_fulfilment'
    | 'error_diagnostics'
  piiPolicy: 'consent_gated_provider_identifiers_only'
}

type EventTrigger = {
  description: string
  sources: readonly ('browser' | 'server' | 'webhook')[]
  repeatability: string
  eventTime: string
  prerequisites: readonly string[]
}

type EventDedupePolicy = {
  eventId: string
  reuse: string
  newEvent: string
  ledgerIdempotencyKey: string
  providerIdempotencyKey: string
  browserServerShareEventId: boolean
  retention: {
    value: number
    unit: 'day' | 'month' | 'year'
    scope: 'dedupe_key_only'
  }
}

type EventCatalogEntry = {
  version: 1
  name: string
  lifecycle: CatalogLifecycle
  owner: string
  trigger: EventTrigger
  dedupe: EventDedupePolicy
  consent: EventConsentPolicy
  providers: Readonly<Record<ProviderId, ProviderCatalogEntry>>
  signals: CanonicalEventSignalPolicy
}

type EventCatalogEntryBase = Omit<EventCatalogEntry, 'signals'>

const analyticsExport = ['analytics'] as const
const marketingExport = ['marketing'] as const
const noMarketingExport = [] as const

const pageConsent = {
  browserCreation: 'local_ephemeral_allowed',
  firstPartyCollection: ['analytics', 'marketing'],
  canonicalLedger: ['analytics', 'marketing'],
  analyticsExport,
  marketingExport,
  googleCookielessPing: 'allowed_by_consent_mode',
  operationalPurpose: 'none',
  piiPolicy: 'consent_gated_provider_identifiers_only'
} as const satisfies EventConsentPolicy

const behaviorConsent = {
  browserCreation: 'local_ephemeral_allowed',
  firstPartyCollection: ['analytics', 'marketing'],
  canonicalLedger: ['analytics', 'marketing'],
  analyticsExport,
  marketingExport,
  googleCookielessPing: 'allowed_by_consent_mode',
  operationalPurpose: 'none',
  piiPolicy: 'consent_gated_provider_identifiers_only'
} as const satisfies EventConsentPolicy

const mutationConsent = {
  browserCreation: 'after_authoritative_response',
  firstPartyCollection: ['analytics', 'marketing'],
  canonicalLedger: ['analytics', 'marketing'],
  analyticsExport,
  marketingExport,
  googleCookielessPing: 'allowed_by_consent_mode',
  operationalPurpose: 'commerce_mutation',
  piiPolicy: 'consent_gated_provider_identifiers_only'
} as const satisfies EventConsentPolicy

const transactionConsent = {
  browserCreation: 'authoritative_server_source',
  firstPartyCollection: ['operational'],
  canonicalLedger: ['operational'],
  analyticsExport,
  marketingExport,
  googleCookielessPing: 'not_applicable',
  operationalPurpose: 'order_accounting',
  piiPolicy: 'consent_gated_provider_identifiers_only'
} as const satisfies EventConsentPolicy

const leadConsent = {
  browserCreation: 'after_authoritative_response',
  firstPartyCollection: ['analytics', 'marketing'],
  canonicalLedger: ['analytics', 'marketing'],
  analyticsExport,
  marketingExport,
  googleCookielessPing: 'allowed_by_consent_mode',
  operationalPurpose: 'lead_fulfilment',
  piiPolicy: 'consent_gated_provider_identifiers_only'
} as const satisfies EventConsentPolicy

const errorConsent = {
  browserCreation: 'after_authoritative_response',
  firstPartyCollection: ['analytics', 'operational'],
  canonicalLedger: ['analytics', 'operational'],
  analyticsExport,
  marketingExport: noMarketingExport,
  googleCookielessPing: 'allowed_by_consent_mode',
  operationalPurpose: 'error_diagnostics',
  piiPolicy: 'consent_gated_provider_identifiers_only'
} as const satisfies EventConsentPolicy

const metaAppConsent = {
  browserCreation: 'authoritative_server_source',
  firstPartyCollection: ['marketing'],
  canonicalLedger: ['marketing'],
  analyticsExport,
  marketingExport,
  googleCookielessPing: 'not_applicable',
  operationalPurpose: 'none',
  piiPolicy: 'consent_gated_provider_identifiers_only'
} as const satisfies EventConsentPolicy

const metaOfflineConsent = {
  ...metaAppConsent,
  operationalPurpose: 'order_accounting'
} as const satisfies EventConsentPolicy

const baseCanonicalParameters = [
  'event_id',
  'event_name',
  'event_time',
  'consent'
] as const

const baseProviderParameters = [
  'event_id',
  'event_time'
] as const

function providerMapping(
  input: Omit<ProviderCatalogEntry, 'signalDelivery'>
): ProviderCatalogEntry {
  return {
    ...input,
    signalDelivery: resolveProviderSignalDelivery(
      input.transport
    )
  }
}

function notRelevantProvider(
  detail: string
): ProviderCatalogEntry {
  return providerMapping({
    support: 'not_relevant',
    eventName: null,
    transport: { browser: null, server: null },
    requiredParameters: [],
    dedupeField: null,
    consentRequirement: 'none',
    adapterVersion: null,
    productionStatus: 'not_relevant',
    productionDetail: detail,
    serverOutbox: 'disabled'
  })
}

function metaNonWebProviders(
  eventName: 'meta_app_event' | 'meta_offline_event',
  input: {
    requiredParameters: readonly string[]
    transport:
      | 'meta_conversions_api_app'
      | 'meta_conversions_api_offline'
  }
): Readonly<Record<ProviderId, ProviderCatalogEntry>> {
  return {
    supabase: providerMapping({
      support: 'supported',
      eventName,
      transport: { browser: null, server: 'first_party_api' },
      requiredParameters: [
        ...baseCanonicalParameters,
        'meta_event'
      ],
      dedupeField: 'event_id',
      consentRequirement: 'marketing',
      adapterVersion: 1,
      productionStatus: 'active',
      productionDetail:
        'Authenticated source events are persisted in the canonical ledger.',
      serverOutbox: 'disabled'
    }),
    google: notRelevantProvider(
      'Source-specific Meta events are not exported to Google.'
    ),
    meta: providerMapping({
      support: 'supported',
      eventName: 'source_meta_event_name',
      transport: { browser: null, server: input.transport },
      requiredParameters: [
        ...baseProviderParameters,
        'action_source',
        'user_data',
        ...input.requiredParameters
      ],
      dedupeField: 'source_event_id',
      consentRequirement: 'marketing',
      adapterVersion: 1,
      productionStatus: 'active',
      productionDetail:
        'Meta Business SDK v26 outbox delivery is active for authenticated, consent-qualified source events.',
      serverOutbox: 'active'
    }),
    microsoft_uet: notRelevantProvider(
      'Source-specific Meta events are not exported to Microsoft UET.'
    ),
    pinterest: notRelevantProvider(
      'Source-specific Meta events are not exported to Pinterest.'
    ),
    snapchat: notRelevantProvider(
      'Source-specific Meta events are not exported to Snapchat.'
    )
  }
}

function pinterestCatalogProvider(
  eventName: string,
  input: {
    active: boolean
    requiredParameters?: readonly string[]
  }
): ProviderCatalogEntry {
  return providerMapping({
    support: 'supported',
    eventName,
    transport: {
      browser: 'pinterest_tag',
      server: 'pinterest_conversions_api'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'event_source_url',
      'user_data',
      ...(input.requiredParameters ?? [])
    ],
    dedupeField: 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 1,
    productionStatus: input.active ? 'active' : 'planned',
    productionDetail:
      input.active ?
        'Pinterest Tag and Conversions API outbox are active.'
      : 'Pinterest mapping is specified but canonical routing is not active.',
    serverOutbox: input.active ? 'active' : 'disabled'
  })
}

function snapchatCatalogProvider(
  eventName: string,
  input: {
    active: boolean
    browser: BrowserTransport | null
    dedupeField?: string
    requiredParameters?: readonly string[]
  }
): ProviderCatalogEntry {
  return providerMapping({
    support: 'supported',
    eventName,
    transport: {
      browser: input.browser,
      server: 'snap_conversions_api_v3'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'action_source',
      'event_source_url',
      'user_data',
      ...(input.requiredParameters ?? [])
    ],
    dedupeField: input.dedupeField ?? 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 1,
    productionStatus: input.active ? 'active' : 'planned',
    productionDetail:
      input.active ?
        'Utekos-owned Snap Pixel and Conversions API v3 outbox are active.'
      : 'Snapchat mapping is specified but canonical routing is not active.',
    serverOutbox: input.active ? 'active' : 'disabled'
  })
}

type PlannedProviderInput = {
  firstPartyConsentRequirement?: ProviderConsentRequirement
  googleRequired?: readonly string[]
  meta?: {
    eventName: string
    requiredParameters?: readonly string[]
  }
  microsoft?: {
    eventName: string
    requiredParameters?: readonly string[]
  }
  pinterest?: {
    eventName: string
    requiredParameters?: readonly string[]
  }
  snapchat?: {
    browser?: BrowserTransport | null
    dedupeField?: string
    eventName: string
    requiredParameters?: readonly string[]
  }
}

function plannedProviders(
  eventName: string,
  input: PlannedProviderInput = {}
): Readonly<Record<ProviderId, ProviderCatalogEntry>> {
  return {
    supabase: providerMapping({
      support: 'planned',
      eventName,
      transport: { browser: null, server: 'first_party_api' },
      requiredParameters: baseCanonicalParameters,
      dedupeField: 'event_id',
      consentRequirement:
        input.firstPartyConsentRequirement ??
        'analytics_or_marketing',
      adapterVersion: 1,
      productionStatus: 'planned',
      productionDetail:
        'Canonical schema, collector, and ledger mapping are not active yet.',
      serverOutbox: 'disabled'
    }),
    google: providerMapping({
      support: 'supported',
      eventName,
      transport: {
        browser: 'google_tag_manager',
        server: 'server_side_gtm'
      },
      requiredParameters: [
        ...baseProviderParameters,
        ...(input.googleRequired ?? [])
      ],
      dedupeField: 'event_id',
      consentRequirement: 'analytics',
      adapterVersion: 1,
      productionStatus: 'planned',
      productionDetail:
        'Provider mapping is specified but canonical routing is not active.',
      serverOutbox: 'disabled'
    }),
    meta:
      input.meta ?
        providerMapping({
          support: 'supported',
          eventName: input.meta.eventName,
          transport: {
            browser: 'meta_pixel',
            server: 'meta_conversions_api'
          },
          requiredParameters: [
            ...baseProviderParameters,
            'action_source',
            'event_source_url',
            'user_data',
            ...(input.meta.requiredParameters ?? [])
          ],
          dedupeField: 'event_id',
          consentRequirement: 'marketing',
          adapterVersion: 1,
          productionStatus: 'planned',
          productionDetail:
            'Marketing mapping is specified but canonical routing is not active.',
          serverOutbox: 'disabled'
        })
      : notRelevantProvider(
          'No v1 marketing use case justifies a Meta export.'
        ),
    microsoft_uet:
      input.microsoft ?
        providerMapping({
          support: 'supported',
          eventName: input.microsoft.eventName,
          transport: {
            browser: 'microsoft_uet',
            server: 'microsoft_uet_capi'
          },
          requiredParameters: [
            ...baseProviderParameters,
            ...(input.microsoft.requiredParameters ?? [])
          ],
          dedupeField: 'event_id',
          consentRequirement: 'marketing',
          adapterVersion: 1,
          productionStatus: 'planned',
          productionDetail:
            'Marketing mapping is specified but canonical routing is not active.',
          serverOutbox: 'disabled'
        })
      : notRelevantProvider(
          'No v1 marketing use case justifies a Microsoft UET export.'
        ),
    pinterest:
      input.pinterest ?
        pinterestCatalogProvider(input.pinterest.eventName, {
          active: false,
          ...(input.pinterest.requiredParameters ?
            {
              requiredParameters:
                input.pinterest.requiredParameters
            }
          : {})
        })
      : notRelevantProvider(
          'No v1 Pinterest conversion mapping is approved.'
        ),
    snapchat:
      input.snapchat ?
        snapchatCatalogProvider(input.snapchat.eventName, {
          active: false,
          browser: input.snapchat.browser ?? null,
          ...(input.snapchat.dedupeField ?
            { dedupeField: input.snapchat.dedupeField }
          : {}),
          ...(input.snapchat.requiredParameters ?
            {
              requiredParameters:
                input.snapchat.requiredParameters
            }
          : {})
        })
      : notRelevantProvider(
          'No v1 Snapchat conversion mapping is approved.'
        )
  }
}

type ActiveProviderInput = PlannedProviderInput & {
  commerce?: boolean
  firstPartyRequired?: readonly string[]
}

function activeEventProviders(
  eventName: string,
  input: ActiveProviderInput = {}
): Readonly<Record<ProviderId, ProviderCatalogEntry>> {
  const googleRequired =
    input.commerce ?
      ([
        'client_id',
        'transaction_id',
        'currency',
        'value',
        'items',
        ...(input.googleRequired ?? [])
      ] as const)
    : (['client_id', ...(input.googleRequired ?? [])] as const)

  return {
    supabase: providerMapping({
      support: 'supported',
      eventName,
      transport: { browser: null, server: 'first_party_api' },
      requiredParameters: [
        ...baseCanonicalParameters,
        ...(input.firstPartyRequired ?? [])
      ],
      dedupeField: 'event_id',
      consentRequirement:
        input.firstPartyConsentRequirement ??
        'analytics_or_marketing',
      adapterVersion: 1,
      productionStatus: 'active',
      productionDetail:
        'Canonical first-party persistence is active.',
      serverOutbox: 'disabled'
    }),
    google: providerMapping({
      support: 'supported',
      eventName,
      transport: {
        browser: 'google_tag_manager',
        server: 'google_data_manager'
      },
      requiredParameters: [
        ...baseProviderParameters,
        ...googleRequired
      ],
      dedupeField:
        input.commerce ? 'transaction_id' : 'event_id',
      consentRequirement: 'analytics',
      adapterVersion: 1,
      productionStatus: 'active',
      productionDetail:
        'GTM/sGTM and Data Manager outbox are active.',
      serverOutbox: 'active'
    }),
    meta:
      input.meta ?
        providerMapping({
          support: 'supported',
          eventName: input.meta.eventName,
          transport: {
            browser: 'meta_pixel',
            server: 'meta_conversions_api'
          },
          requiredParameters: [
            ...baseProviderParameters,
            'action_source',
            'event_source_url',
            'user_data',
            ...(input.meta.requiredParameters ?? [])
          ],
          dedupeField: 'event_id',
          consentRequirement: 'marketing',
          adapterVersion: 1,
          productionStatus: 'active',
          productionDetail: 'Meta CAPI delivery is active.',
          serverOutbox: 'active'
        })
      : notRelevantProvider(
          'No v1 marketing use case justifies a Meta export.'
        ),
    microsoft_uet:
      input.microsoft ?
        providerMapping({
          support: 'supported',
          eventName: input.microsoft.eventName,
          transport: {
            browser: 'microsoft_uet',
            server: 'microsoft_uet_capi'
          },
          requiredParameters: [
            ...baseProviderParameters,
            ...(input.microsoft.requiredParameters ?? [])
          ],
          dedupeField: 'event_id',
          consentRequirement: 'marketing',
          adapterVersion: 1,
          productionStatus: 'active',
          productionDetail:
            'Browser UET is active; server delivery is blocked because no UET CAPI worker exists.',
          serverOutbox: 'blocked_no_worker'
        })
      : notRelevantProvider(
          'No v1 marketing use case justifies a Microsoft UET export.'
        ),
    pinterest:
      input.pinterest ?
        pinterestCatalogProvider(input.pinterest.eventName, {
          active: true,
          ...(input.pinterest.requiredParameters ?
            {
              requiredParameters:
                input.pinterest.requiredParameters
            }
          : {})
        })
      : notRelevantProvider(
          'No v1 Pinterest conversion mapping is approved.'
        ),
    snapchat:
      input.snapchat ?
        snapchatCatalogProvider(input.snapchat.eventName, {
          active: true,
          browser: input.snapchat.browser ?? null,
          ...(input.snapchat.dedupeField ?
            { dedupeField: input.snapchat.dedupeField }
          : {}),
          ...(input.snapchat.requiredParameters ?
            {
              requiredParameters:
                input.snapchat.requiredParameters
            }
          : {})
        })
      : notRelevantProvider(
          'No v1 Snapchat conversion mapping is approved.'
        )
  }
}

function dedupe(
  eventId: string,
  newEvent: string,
  retention: EventDedupePolicy['retention'],
  browserServerShareEventId = true
): EventDedupePolicy {
  return {
    eventId,
    reuse:
      'Reuse the same event_id for retries and every delivery of the same canonical occurrence.',
    newEvent,
    ledgerIdempotencyKey: 'event_name + event_id',
    providerIdempotencyKey: 'provider + event_name + event_id',
    browserServerShareEventId,
    retention
  }
}

const retain30Days = {
  value: 30,
  unit: 'day',
  scope: 'dedupe_key_only'
} as const

const retain90Days = {
  value: 90,
  unit: 'day',
  scope: 'dedupe_key_only'
} as const

const retain25Months = {
  value: 25,
  unit: 'month',
  scope: 'dedupe_key_only'
} as const

const retain7Years = {
  value: 7,
  unit: 'year',
  scope: 'dedupe_key_only'
} as const

const pageViewProviders = {
  supabase: providerMapping({
    support: 'supported',
    eventName: 'page_view',
    transport: { browser: null, server: 'first_party_api' },
    requiredParameters: [
      ...baseCanonicalParameters,
      'page_view_id',
      'page_url'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'analytics_or_marketing',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'Canonical first-party persistence is active.',
    serverOutbox: 'disabled'
  }),
  google: providerMapping({
    support: 'supported',
    eventName: 'page_view',
    transport: {
      browser: 'google_tag_manager',
      server: 'server_side_gtm'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'page_location',
      'page_title'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'analytics',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'Canonical browser event is handled through GTM/sGTM; no server outbox is allowed.',
    serverOutbox: 'disabled'
  }),
  meta: providerMapping({
    support: 'supported',
    eventName: 'PageView',
    transport: {
      browser: 'meta_pixel',
      server: 'meta_conversions_api'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'action_source',
      'event_source_url',
      'user_data'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'The app-owned Meta Pixel is the sole browser event owner and the canonical Meta CAPI outbox is the sole server event owner. Signals Gateway browser transport and the manual GTM cbq bridge are disabled, and historical blocked rows remain excluded from blind replay.',
    serverOutbox: 'active'
  }),
  microsoft_uet: providerMapping({
    support: 'supported',
    eventName: 'page_view',
    transport: {
      browser: 'microsoft_uet',
      server: 'microsoft_uet_capi'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'page_load_id',
      'event_source_url',
      'user_data_identifier'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 2,
    productionStatus: 'active',
    productionDetail:
      'Browser UET and CAPI pageLoad delivery are active for newly accepted consented page views. Historical blocked rows must not be replayed.',
    serverOutbox: 'active'
  }),
  pinterest: notRelevantProvider(
    'Canonical page_view is not mapped to Pinterest PageVisit; product view_item owns PageVisit with catalog product IDs.'
  ),
  snapchat: snapchatCatalogProvider('PAGE_VIEW', {
    active: true,
    browser: 'snap_pixel'
  })
} as const satisfies Readonly<
  Record<ProviderId, ProviderCatalogEntry>
>

const viewItemProviders = {
  supabase: providerMapping({
    support: 'supported',
    eventName: 'view_item',
    transport: { browser: null, server: 'first_party_api' },
    requiredParameters: [
      ...baseCanonicalParameters,
      'page_view_id',
      'currency',
      'value',
      'items'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'analytics_or_marketing',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'Canonical first-party persistence is active.',
    serverOutbox: 'disabled'
  }),
  google: providerMapping({
    support: 'supported',
    eventName: 'view_item',
    transport: {
      browser: 'google_tag_manager',
      server: 'google_data_manager'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'client_id',
      'transaction_id',
      'currency',
      'value',
      'items'
    ],
    dedupeField: 'transaction_id',
    consentRequirement: 'analytics',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'GTM/sGTM and executed Data Manager are active. Local application mappings use canonical event_id as transaction_id, but published GTM forwarding is not live-verified, so cross-source deduplication remains a release risk.',
    serverOutbox: 'active'
  }),
  meta: providerMapping({
    support: 'supported',
    eventName: 'ViewContent',
    transport: {
      browser: 'meta_pixel',
      server: 'meta_conversions_api'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'action_source',
      'event_source_url',
      'user_data',
      'content_ids',
      'content_type',
      'currency',
      'value'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'The app-owned Meta Pixel is the sole browser event owner and the canonical Meta CAPI outbox is the sole server event owner. Signals Gateway browser transport and the manual GTM cbq bridge are disabled.',
    serverOutbox: 'active'
  }),
  microsoft_uet: providerMapping({
    support: 'supported',
    eventName: 'view_item',
    transport: {
      browser: 'microsoft_uet',
      server: 'microsoft_uet_capi'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'items',
      'currency',
      'value'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'Browser UET is active; server delivery is blocked because no UET CAPI worker exists.',
    serverOutbox: 'blocked_no_worker'
  }),
  pinterest: pinterestCatalogProvider('page_visit', {
    active: true,
    requiredParameters: [
      'content_ids',
      'contents',
      'currency',
      'value'
    ]
  }),
  snapchat: snapchatCatalogProvider('VIEW_CONTENT', {
    active: true,
    browser: 'snap_pixel',
    requiredParameters: [
      'content_ids',
      'contents',
      'currency',
      'value'
    ]
  })
} as const satisfies Readonly<
  Record<ProviderId, ProviderCatalogEntry>
>

const addToCartProviders = {
  supabase: providerMapping({
    support: 'supported',
    eventName: 'add_to_cart',
    transport: { browser: null, server: 'first_party_api' },
    requiredParameters: [
      ...baseCanonicalParameters,
      'currency',
      'value',
      'items'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'analytics_or_marketing',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'Canonical first-party persistence is active.',
    serverOutbox: 'disabled'
  }),
  google: providerMapping({
    support: 'supported',
    eventName: 'add_to_cart',
    transport: {
      browser: 'google_tag_manager',
      server: 'google_data_manager'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'client_id',
      'transaction_id',
      'currency',
      'value',
      'items'
    ],
    dedupeField: 'transaction_id',
    consentRequirement: 'analytics',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'GTM/sGTM and Data Manager outbox are active for add_to_cart.',
    serverOutbox: 'active'
  }),
  meta: providerMapping({
    support: 'supported',
    eventName: 'AddToCart',
    transport: {
      browser: 'meta_pixel',
      server: 'meta_conversions_api'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'action_source',
      'event_source_url',
      'user_data',
      'content_ids',
      'currency',
      'value'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'The app-owned Meta Pixel is the sole browser event owner for add_to_cart and the canonical Meta CAPI outbox is the sole server event owner. Signals Gateway browser transport and the manual GTM cbq bridge are disabled.',
    serverOutbox: 'active'
  }),
  microsoft_uet: providerMapping({
    support: 'supported',
    eventName: 'add_to_cart',
    transport: {
      browser: 'microsoft_uet',
      server: 'microsoft_uet_capi'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'items',
      'currency',
      'value',
      'user_data_identifier'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 2,
    productionStatus: 'active',
    productionDetail:
      'Browser UET is active; Microsoft UET CAPI add_to_cart outbox is active when marketing consent is granted and at least one Microsoft-supported userData identifier is present.',
    serverOutbox: 'active'
  }),
  pinterest: pinterestCatalogProvider('add_to_cart', {
    active: true,
    requiredParameters: [
      'content_ids',
      'contents',
      'currency',
      'value'
    ]
  }),
  snapchat: snapchatCatalogProvider('ADD_CART', {
    active: true,
    browser: 'snap_pixel',
    requiredParameters: [
      'content_ids',
      'contents',
      'currency',
      'value'
    ]
  })
} as const satisfies Readonly<
  Record<ProviderId, ProviderCatalogEntry>
>

const beginCheckoutProviders = {
  supabase: providerMapping({
    support: 'supported',
    eventName: 'begin_checkout',
    transport: { browser: null, server: 'first_party_api' },
    requiredParameters: [
      ...baseCanonicalParameters,
      'cart_id',
      'currency',
      'value',
      'items'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'analytics_or_marketing',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'Canonical first-party persistence is active.',
    serverOutbox: 'disabled'
  }),
  google: providerMapping({
    support: 'supported',
    eventName: 'begin_checkout',
    transport: {
      browser: 'google_tag_manager',
      server: 'google_data_manager'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'client_id',
      'transaction_id',
      'currency',
      'value',
      'items'
    ],
    dedupeField: 'transaction_id',
    consentRequirement: 'analytics',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'GTM/sGTM and Data Manager outbox are active for begin_checkout.',
    serverOutbox: 'active'
  }),
  meta: providerMapping({
    support: 'supported',
    eventName: 'InitiateCheckout',
    transport: {
      browser: 'meta_pixel',
      server: 'meta_conversions_api'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'action_source',
      'event_source_url',
      'user_data',
      'content_ids',
      'currency',
      'value'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'The app-owned Meta Pixel is the sole browser event owner for begin_checkout and the canonical Meta CAPI outbox is the sole server event owner. Signals Gateway browser transport and the manual GTM cbq bridge are disabled.',
    serverOutbox: 'active'
  }),
  microsoft_uet: providerMapping({
    support: 'supported',
    eventName: 'begin_checkout',
    transport: {
      browser: 'microsoft_uet',
      server: 'microsoft_uet_capi'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'items',
      'currency',
      'value',
      'user_data_identifier'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 2,
    productionStatus: 'active',
    productionDetail:
      'Browser UET is active; Microsoft UET CAPI outbox worker is active for begin_checkout when at least one Microsoft-supported userData identifier is present.',
    serverOutbox: 'active'
  }),
  pinterest: pinterestCatalogProvider('initiate_checkout', {
    active: true,
    requiredParameters: [
      'content_ids',
      'contents',
      'currency',
      'value'
    ]
  }),
  snapchat: snapchatCatalogProvider('START_CHECKOUT', {
    active: true,
    browser: 'snap_pixel',
    requiredParameters: [
      'content_ids',
      'contents',
      'currency',
      'value'
    ]
  })
} as const satisfies Readonly<
  Record<ProviderId, ProviderCatalogEntry>
>

const checkoutProgressMetaTransport = {
  browser: null,
  server: 'meta_conversions_api'
} as const

const addShippingInfoProviderBase = activeEventProviders(
  'add_shipping_info',
  {
    commerce: true,
    firstPartyRequired: [
      'checkout_id',
      'shipping_revision',
      'begin_checkout_event_id',
      'currency',
      'value',
      'items'
    ],
    meta: {
      eventName: 'AddShippingInfo',
      requiredParameters: [
        'content_ids',
        'contents',
        'currency',
        'value'
      ]
    }
  }
)
const addShippingInfoGoogleTransport = {
  browser: null,
  server: null
} as const
const addShippingInfoProviders = {
  ...addShippingInfoProviderBase,
  google: {
    ...addShippingInfoProviderBase.google,
    transport: addShippingInfoGoogleTransport,
    productionStatus: 'planned',
    productionDetail:
      'Google delivery remains disabled until an add_shipping_info Data Manager adapter is approved.',
    serverOutbox: 'disabled',
    signalDelivery: resolveProviderSignalDelivery(
      addShippingInfoGoogleTransport
    )
  },
  meta: {
    ...addShippingInfoProviderBase.meta,
    transport: checkoutProgressMetaTransport,
    productionDetail:
      'Meta Conversions API is the active provider owner for this Shopify checkout event.',
    signalDelivery: resolveProviderSignalDelivery(
      checkoutProgressMetaTransport
    )
  }
} as const satisfies Readonly<
  Record<ProviderId, ProviderCatalogEntry>
>

const addPaymentInfoProviderBase = activeEventProviders(
  'add_payment_info',
  {
    commerce: true,
    firstPartyRequired: [
      'checkout_id',
      'payment_revision',
      'begin_checkout_event_id',
      'currency',
      'value',
      'items'
    ],
    meta: {
      eventName: 'AddPaymentInfo',
      requiredParameters: [
        'content_ids',
        'contents',
        'currency',
        'value'
      ]
    },
    snapchat: {
      browser: 'shopify_customer_events',
      dedupeField: 'payment_revision',
      eventName: 'ADD_BILLING',
      requiredParameters: [
        'content_ids',
        'contents',
        'currency',
        'value'
      ]
    }
  }
)
const addPaymentInfoGoogleTransport = {
  browser: null,
  server: 'google_data_manager'
} as const
const addPaymentInfoProviders = {
  ...addPaymentInfoProviderBase,
  google: {
    ...addPaymentInfoProviderBase.google,
    transport: addPaymentInfoGoogleTransport,
    productionDetail:
      'Google Data Manager remains active after the event-specific Shopify Custom Pixel cutover.',
    signalDelivery: resolveProviderSignalDelivery(
      addPaymentInfoGoogleTransport
    )
  },
  meta: {
    ...addPaymentInfoProviderBase.meta,
    transport: checkoutProgressMetaTransport,
    productionDetail:
      'Meta Conversions API is active for marketing-consented Shopify payment submissions.',
    signalDelivery: resolveProviderSignalDelivery(
      checkoutProgressMetaTransport
    )
  }
} as const satisfies Readonly<
  Record<ProviderId, ProviderCatalogEntry>
>

const purchaseProviders = {
  supabase: providerMapping({
    support: 'supported',
    eventName: 'purchase',
    transport: { browser: null, server: 'first_party_api' },
    requiredParameters: [
      ...baseCanonicalParameters,
      'transaction_id',
      'currency',
      'value',
      'items'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'operational',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'Operational ledger persistence via Shopify orders-paid webhook.',
    serverOutbox: 'disabled'
  }),
  google: providerMapping({
    support: 'supported',
    eventName: 'purchase',
    transport: {
      browser: 'shopify_customer_events',
      server: 'google_data_manager'
    },
    requiredParameters: [
      ...baseProviderParameters,
      'one_of(client_id,gclid,user_id)',
      'transaction_id',
      'currency',
      'value',
      'items'
    ],
    dedupeField: 'transaction_id',
    consentRequirement: 'analytics',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'Shopify Customer Events is the browser source and the Data Manager purchase outbox is the supplementary server source when checkout analytics consent was granted. Both use transaction_id for GA4 deduplication.',
    serverOutbox: 'active'
  }),
  meta: providerMapping({
    support: 'supported',
    eventName: 'Purchase',
    transport: { browser: null, server: 'meta_conversions_api' },
    requiredParameters: [
      ...baseProviderParameters,
      'action_source',
      'content_ids',
      'currency',
      'value'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'Meta CAPI purchase outbox is active when checkout marketing consent was granted.',
    serverOutbox: 'active'
  }),
  microsoft_uet: providerMapping({
    support: 'supported',
    eventName: 'purchase',
    transport: { browser: null, server: 'microsoft_uet_capi' },
    requiredParameters: [
      ...baseProviderParameters,
      'revenue_value',
      'currency',
      'items',
      'user_data_identifier'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'marketing',
    adapterVersion: 2,
    productionStatus: 'active',
    productionDetail:
      'Microsoft UET CAPI purchase outbox is active when checkout marketing consent was granted and at least one Microsoft-supported userData identifier is present.',
    serverOutbox: 'active'
  }),
  pinterest: pinterestCatalogProvider('checkout', {
    active: true,
    requiredParameters: [
      'content_ids',
      'contents',
      'currency',
      'value',
      'order_id'
    ]
  }),
  snapchat: snapchatCatalogProvider('PURCHASE', {
    active: true,
    browser: 'shopify_customer_events',
    dedupeField: 'transaction_id',
    requiredParameters: [
      'content_ids',
      'contents',
      'currency',
      'value',
      'order_id'
    ]
  })
} as const satisfies Readonly<
  Record<ProviderId, ProviderCatalogEntry>
>

const refundProviders = {
  supabase: providerMapping({
    support: 'supported',
    eventName: 'refund',
    transport: { browser: null, server: 'first_party_api' },
    requiredParameters: [
      ...baseCanonicalParameters,
      'transaction_id',
      'currency',
      'value',
      'items'
    ],
    dedupeField: 'event_id',
    consentRequirement: 'operational',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'Operational ledger persistence via Shopify refunds-create webhook.',
    serverOutbox: 'disabled'
  }),
  google: providerMapping({
    support: 'supported',
    eventName: 'refund',
    transport: { browser: null, server: 'google_data_manager' },
    requiredParameters: [
      ...baseProviderParameters,
      'transaction_id',
      'currency',
      'value',
      'items'
    ],
    dedupeField: 'transaction_id',
    consentRequirement: 'analytics',
    adapterVersion: 1,
    productionStatus: 'active',
    productionDetail:
      'Data Manager refund outbox is active when analytics consent is available.',
    serverOutbox: 'active'
  }),
  meta: notRelevantProvider(
    'No v1 Meta refund mapping is approved.'
  ),
  microsoft_uet: notRelevantProvider(
    'No v1 Microsoft UET refund mapping is approved.'
  ),
  pinterest: notRelevantProvider(
    'No v1 Pinterest refund mapping is approved.'
  ),
  snapchat: notRelevantProvider(
    'No v1 Snapchat refund mapping is approved.'
  )
} as const satisfies Readonly<
  Record<ProviderId, ProviderCatalogEntry>
>

const eventCatalogBase = {
  page_view: {
    version: 1,
    name: 'page_view',
    lifecycle: 'active',
    owner: 'next_router',
    trigger: {
      description:
        'Create after the initial canonical view is committed or a Next.js navigation has completed with its final URL.',
      sources: ['browser'],
      repeatability: 'Once per committed navigation.',
      eventTime: 'The committed navigation timestamp.',
      prerequisites: [
        'final canonical URL',
        'page title',
        'page_view_id',
        'consent snapshot'
      ]
    },
    dedupe: dedupe(
      'navigation_id',
      'A later committed navigation receives a new event_id.',
      retain30Days
    ),
    consent: pageConsent,
    providers: pageViewProviders
  },
  view_item_list: {
    version: 1,
    name: 'view_item_list',
    lifecycle: 'active',
    owner: 'storefront_product_list',
    trigger: {
      description:
        'Create when a named product list and its resolved items are actually visible.',
      sources: ['browser'],
      repeatability:
        'May repeat for a new list impression sequence on the same page.',
      eventTime: 'The qualifying list-visibility timestamp.',
      prerequisites: [
        'page_view_id',
        'item_list_id',
        'impression_sequence',
        'resolved items'
      ]
    },
    dedupe: dedupe(
      'page_view_id + item_list_id + impression_sequence',
      'A new qualifying impression sequence receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('view_item_list', {
      commerce: true,
      googleRequired: ['item_list_id', 'items'],
      firstPartyRequired: [
        'page_view_id',
        'item_list_id',
        'items'
      ],
      meta: {
        eventName: 'ViewItemList',
        requiredParameters: [
          'content_ids',
          'contents',
          'currency',
          'value',
          'item_list_id',
          'item_list_name'
        ]
      },
      microsoft: {
        eventName: 'view_item_list',
        requiredParameters: ['items']
      }
    })
  },
  select_item: {
    version: 1,
    name: 'select_item',
    lifecycle: 'active',
    owner: 'storefront_product_link',
    trigger: {
      description:
        'Create when an accepted product selection initiates navigation from a resolved list.',
      sources: ['browser'],
      repeatability:
        'Each accepted product-selection interaction is new.',
      eventTime: 'The accepted interaction timestamp.',
      prerequisites: [
        'interaction_id',
        'item_list_id',
        'selected item',
        'destination URL'
      ]
    },
    dedupe: dedupe(
      'interaction_id',
      'A separate accepted product selection receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('select_item', {
      commerce: true,
      googleRequired: ['item_list_id', 'items'],
      meta: {
        eventName: 'SelectItem',
        requiredParameters: [
          'currency',
          'value',
          'contents',
          'content_ids'
        ]
      },
      microsoft: {
        eventName: 'select_item',
        requiredParameters: ['items']
      }
    })
  },
  view_item: {
    version: 1,
    name: 'view_item',
    lifecycle: 'active',
    owner: 'storefront_product_view',
    trigger: {
      description:
        'Create when the product and selected variant are resolved and the product view is visible.',
      sources: ['browser'],
      repeatability:
        'May repeat for a new product view or a newly resolved variant context.',
      eventTime: 'The resolved product-view timestamp.',
      prerequisites: [
        'page_view_id',
        'product_id',
        'variant_id',
        'currency',
        'value',
        'items',
        'consent snapshot'
      ]
    },
    dedupe: dedupe(
      'page_view_id + product_id + variant_id + view_sequence',
      'A new product view or resolved variant context receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: viewItemProviders
  },
  add_to_wishlist: {
    version: 1,
    name: 'add_to_wishlist',
    lifecycle: 'active',
    owner: 'wishlist_store',
    trigger: {
      description:
        'Create only after the wishlist store confirms that the item was persisted.',
      sources: ['browser', 'server'],
      repeatability: 'Each successful wishlist mutation is new.',
      eventTime: 'The successful persistence timestamp.',
      prerequisites: [
        'mutation_id',
        'item',
        'updated wishlist state'
      ]
    },
    dedupe: dedupe(
      'wishlist_mutation_id',
      'A separate successful wishlist mutation receives a new event_id.',
      retain90Days
    ),
    consent: mutationConsent,
    providers: activeEventProviders('add_to_wishlist', {
      commerce: true,
      googleRequired: ['currency', 'value', 'items'],
      meta: {
        eventName: 'AddToWishlist',
        requiredParameters: ['content_ids', 'currency', 'value']
      },
      microsoft: {
        eventName: 'add_to_wishlist',
        requiredParameters: ['items']
      },
      pinterest: {
        eventName: 'add_to_wishlist',
        requiredParameters: [
          'content_ids',
          'contents',
          'currency',
          'value'
        ]
      }
    })
  },
  add_to_cart: {
    version: 1,
    name: 'add_to_cart',
    lifecycle: 'active',
    owner: 'shopify_cart_service',
    trigger: {
      description:
        'Create after Shopify accepts the cart mutation and returns the updated cart containing the line.',
      sources: ['browser', 'server'],
      repeatability:
        'Each successful Shopify cart mutation is new.',
      eventTime: 'The successful Shopify response timestamp.',
      prerequisites: [
        'cart_mutation_id',
        'updated cart id',
        'accepted line',
        'currency',
        'value'
      ]
    },
    dedupe: dedupe(
      'cart_mutation_id',
      'A separate successful Shopify mutation receives a new event_id; multiple clicks producing one mutation do not.',
      retain90Days
    ),
    consent: mutationConsent,
    providers: addToCartProviders
  },
  remove_from_cart: {
    version: 1,
    name: 'remove_from_cart',
    lifecycle: 'active',
    owner: 'shopify_cart_service',
    trigger: {
      description:
        'Create after Shopify accepts removal and returns an updated cart without the targeted quantity.',
      sources: ['browser', 'server', 'webhook'],
      repeatability:
        'Each successful Shopify removal mutation is new.',
      eventTime: 'The successful Shopify response timestamp.',
      prerequisites: [
        'cart_mutation_id',
        'updated cart id',
        'removed item',
        'currency',
        'value'
      ]
    },
    dedupe: dedupe(
      'cart_mutation_id',
      'A separate successful Shopify removal receives a new event_id.',
      retain90Days
    ),
    consent: mutationConsent,
    providers: activeEventProviders('remove_from_cart', {
      commerce: true,
      googleRequired: ['currency', 'value', 'items'],
      meta: {
        eventName: 'RemoveFromCart',
        requiredParameters: ['content_ids', 'currency', 'value']
      },
      microsoft: {
        eventName: 'remove_from_cart',
        requiredParameters: ['items']
      }
    })
  },
  view_cart: {
    version: 1,
    name: 'view_cart',
    lifecycle: 'active',
    owner: 'storefront_cart_surface',
    trigger: {
      description:
        'Create when the cart page or drawer and its resolved cart contents are actually visible.',
      sources: ['browser'],
      repeatability:
        'May repeat for a new qualifying cart view sequence.',
      eventTime: 'The qualifying cart-visibility timestamp.',
      prerequisites: [
        'page_view_id',
        'cart_id',
        'view_sequence',
        'resolved items'
      ]
    },
    dedupe: dedupe(
      'page_view_id + cart_id + view_sequence',
      'A new qualifying cart view sequence receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('view_cart', {
      commerce: true,
      googleRequired: ['currency', 'value', 'items'],
      firstPartyRequired: [
        'page_view_id',
        'currency',
        'value',
        'items'
      ],
      meta: {
        eventName: 'ViewCart',
        requiredParameters: [
          'content_ids',
          'contents',
          'currency',
          'value'
        ]
      },
      microsoft: {
        eventName: 'view_cart',
        requiredParameters: ['items', 'currency', 'value']
      }
    })
  },
  begin_checkout: {
    version: 1,
    name: 'begin_checkout',
    lifecycle: 'active',
    owner: 'shopify_checkout_service',
    trigger: {
      description:
        'Create after Shopify returns a valid checkout token or URL for the resolved cart.',
      sources: ['browser', 'server'],
      repeatability: 'Each newly created checkout is new.',
      eventTime:
        'The successful checkout-creation response timestamp.',
      prerequisites: [
        'cart_id',
        'checkout_id or token',
        'creation revision',
        'currency',
        'value',
        'items'
      ]
    },
    dedupe: dedupe(
      'checkout_id + creation_revision',
      'A separately created checkout receives a new event_id.',
      retain90Days
    ),
    consent: mutationConsent,
    providers: beginCheckoutProviders
  },
  add_shipping_info: {
    version: 1,
    name: 'add_shipping_info',
    lifecycle: 'active',
    owner: 'shopify_app_web_pixel',
    trigger: {
      description:
        'Create when Shopify emits checkout_shipping_info_submitted and the PII-free begin_checkout correlation resolves to a consented canonical source. The event proves that a shipping rate was chosen.',
      sources: ['browser'],
      repeatability:
        'Each Shopify shipping-information submission is new.',
      eventTime:
        'The Shopify checkout_shipping_info_submitted timestamp.',
      prerequisites: [
        'Shopify checkout_shipping_info_submitted source event',
        'checkout_id',
        'begin_checkout_event_id correlation',
        'stable Shopify source event id used as shipping revision',
        'analytics consent',
        'items'
      ]
    },
    dedupe: dedupe(
      'Shopify checkout_shipping_info_submitted event_id',
      'A later Shopify submission receives a new event_id; replay of the same source event reuses it.',
      retain90Days
    ),
    consent: mutationConsent,
    providers: addShippingInfoProviders
  },
  add_payment_info: {
    version: 1,
    name: 'add_payment_info',
    lifecycle: 'active',
    owner: 'shopify_app_web_pixel',
    trigger: {
      description:
        'Create when Shopify emits payment_info_submitted and the PII-free begin_checkout correlation resolves to a consented canonical source. payment_info_submitted proves submission only, not payment success.',
      sources: ['browser'],
      repeatability:
        'Each Shopify payment-information submission is new.',
      eventTime: 'The Shopify payment_info_submitted timestamp.',
      prerequisites: [
        'Shopify payment_info_submitted source event',
        'checkout_id',
        'begin_checkout_event_id correlation',
        'stable Shopify source event id used as payment revision',
        'analytics consent',
        'items'
      ]
    },
    dedupe: dedupe(
      'Shopify payment_info_submitted event_id',
      'A later Shopify submission receives a new event_id; replay of the same source event reuses it.',
      retain90Days
    ),
    consent: mutationConsent,
    providers: addPaymentInfoProviders
  },
  purchase: {
    version: 1,
    name: 'purchase',
    lifecycle: 'active',
    owner: 'shopify_admin_notification_order_payment',
    trigger: {
      description:
        'Create from the verified Shopify Admin Order payment notification webhook; reconciliation is duplicate-safe missed-delivery recovery.',
      sources: ['webhook', 'server'],
      repeatability:
        'Webhook retries and reconciliation observations for the same order reuse the same event_id and become duplicates.',
      eventTime: 'The authoritative Shopify paid timestamp.',
      prerequisites: [
        'verified webhook',
        'order_id',
        'financial state',
        'transaction_id',
        'currency',
        'value',
        'items',
        'checkout consent snapshot'
      ]
    },
    dedupe: dedupe(
      'Shopify order legacy ID + paid state',
      'Only a different paid Shopify order receives a new event_id.',
      retain7Years
    ),
    consent: transactionConsent,
    providers: purchaseProviders
  },
  refund: {
    version: 1,
    name: 'refund',
    lifecycle: 'active',
    owner: 'shopify_admin_notification_refund_create',
    trigger: {
      description:
        'Create from the verified Shopify Admin Refund create notification webhook; reconciliation is duplicate-safe missed-delivery recovery.',
      sources: ['webhook', 'server'],
      repeatability:
        'Webhook retries and reconciliation observations for the same refund reuse the same event_id and become duplicates.',
      eventTime:
        'The authoritative Shopify refund created_at timestamp.',
      prerequisites: [
        'verified webhook',
        'refund_id',
        'transaction_id',
        'currency',
        'refunded value',
        'refunded items',
        'checkout consent snapshot'
      ]
    },
    dedupe: dedupe(
      'refund_id',
      'A separate Shopify refund record receives a new event_id.',
      retain7Years
    ),
    consent: transactionConsent,
    providers: refundProviders
  },
  search: {
    version: 1,
    name: 'search',
    lifecycle: 'active',
    owner: 'storefront_search_controller',
    trigger: {
      description:
        'Create after an explicit search request resolves to a result state.',
      sources: ['browser', 'server'],
      repeatability: 'Each explicit resolved search is new.',
      eventTime: 'The resolved search-result timestamp.',
      prerequisites: [
        'search_id',
        'normalized search term',
        'result state'
      ]
    },
    dedupe: dedupe(
      'search_id',
      'A separate explicit search receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('search', {
      googleRequired: ['search_term'],
      meta: {
        eventName: 'Search',
        requiredParameters: ['search_string']
      },
      microsoft: {
        eventName: 'search',
        requiredParameters: ['search_term']
      },
      pinterest: {
        eventName: 'search',
        requiredParameters: ['search_string']
      }
    })
  },
  view_search_results: {
    version: 1,
    name: 'view_search_results',
    lifecycle: 'active',
    owner: 'storefront_search_results',
    trigger: {
      description:
        'Create when the resolved search-result revision is actually visible.',
      sources: ['browser'],
      repeatability: 'Each visible result revision is new.',
      eventTime: 'The qualifying result-visibility timestamp.',
      prerequisites: [
        'search_id',
        'result_revision',
        'normalized search term',
        'result count'
      ]
    },
    dedupe: dedupe(
      'search_id + result_revision',
      'A newly visible result revision receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('view_search_results', {
      googleRequired: ['search_term']
    })
  },
  view_promotion: {
    version: 1,
    name: 'view_promotion',
    lifecycle: 'active',
    owner: 'storefront_promotion_observer',
    trigger: {
      description:
        'Create when a promotion is at least 50 percent visible for at least one continuous second.',
      sources: ['browser'],
      repeatability:
        'Each qualifying promotion impression on a page view is new.',
      eventTime:
        'The timestamp at which the visibility threshold is met.',
      prerequisites: [
        'page_view_id',
        'promotion_id',
        'creative identity',
        'impression sequence'
      ]
    },
    dedupe: dedupe(
      'page_view_id + promotion_id + impression_sequence',
      'A later qualifying impression sequence receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('view_promotion', {
      commerce: true,
      googleRequired: ['promotion_id', 'creative_name', 'items']
    })
  },
  select_promotion: {
    version: 1,
    name: 'select_promotion',
    lifecycle: 'active',
    owner: 'storefront_promotion_link',
    trigger: {
      description:
        'Create when an accepted promotion selection initiates its intended action or navigation.',
      sources: ['browser'],
      repeatability:
        'Each accepted promotion interaction is new.',
      eventTime: 'The accepted interaction timestamp.',
      prerequisites: [
        'interaction_id',
        'promotion_id',
        'creative identity',
        'destination'
      ]
    },
    dedupe: dedupe(
      'interaction_id',
      'A separate accepted promotion selection receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('select_promotion', {
      commerce: true,
      googleRequired: ['promotion_id', 'creative_name', 'items']
    })
  },
  generate_lead: {
    version: 1,
    name: 'generate_lead',
    lifecycle: 'active',
    owner: 'lead_submission_service',
    trigger: {
      description:
        'Create only after the lead or contact submission is accepted and persisted.',
      sources: ['server'],
      repeatability: 'Each accepted lead submission is new.',
      eventTime: 'The authoritative acceptance timestamp.',
      prerequisites: [
        'submission_id',
        'form_id',
        'lead classification without PII'
      ]
    },
    dedupe: dedupe(
      'submission_id',
      'A separate accepted lead submission receives a new event_id.',
      retain25Months
    ),
    consent: leadConsent,
    providers: activeEventProviders('generate_lead', {
      googleRequired: ['currency', 'value'],
      meta: { eventName: 'Lead' },
      microsoft: { eventName: 'generate_lead' },
      pinterest: { eventName: 'lead' }
    })
  },
  form_start: {
    version: 1,
    name: 'form_start',
    lifecycle: 'active',
    owner: 'storefront_form_controller',
    trigger: {
      description:
        'Create on the first meaningful value change in a form, never on focus alone.',
      sources: ['browser'],
      repeatability: 'Once per form and page view.',
      eventTime: 'The first meaningful value-change timestamp.',
      prerequisites: [
        'form_id',
        'page_view_id',
        'field category without value'
      ]
    },
    dedupe: dedupe(
      'form_id + page_view_id',
      'The same form on a new page view receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('form_start', {
      googleRequired: ['form_id', 'form_name'],
      firstPartyRequired: ['form_id', 'page_view_id']
    })
  },
  form_submit: {
    version: 1,
    name: 'form_submit',
    lifecycle: 'active',
    owner: 'form_submission_service',
    trigger: {
      description:
        'Create only after the submission service accepts the form submission.',
      sources: ['server'],
      repeatability: 'Each accepted submission is new.',
      eventTime: 'The authoritative acceptance timestamp.',
      prerequisites: [
        'submission_id',
        'form_id',
        'result without PII'
      ]
    },
    dedupe: dedupe(
      'submission_id',
      'A separate accepted submission receives a new event_id.',
      retain25Months,
      false
    ),
    consent: leadConsent,
    providers: activeEventProviders('form_submit', {
      googleRequired: ['form_id', 'form_name']
    })
  },
  form_error: {
    version: 1,
    name: 'form_error',
    lifecycle: 'active',
    owner: 'form_submission_service',
    trigger: {
      description:
        'Create when a definitive validation or server failure is presented for a submission attempt.',
      sources: ['browser', 'server'],
      repeatability: 'Each failed submission attempt is new.',
      eventTime: 'The definitive failure timestamp.',
      prerequisites: [
        'attempt_id',
        'form_id',
        'safe error category',
        'visible failure state'
      ]
    },
    dedupe: dedupe(
      'attempt_id',
      'A separate failed attempt receives a new event_id.',
      retain90Days
    ),
    consent: errorConsent,
    providers: activeEventProviders('form_error', {
      firstPartyConsentRequirement: 'analytics_or_operational',
      googleRequired: ['form_id', 'error_category']
    })
  },
  filter_apply: {
    version: 1,
    name: 'filter_apply',
    lifecycle: 'active',
    owner: 'storefront_product_filter',
    trigger: {
      description:
        'Create after the selected filters have produced and committed an updated product result revision.',
      sources: ['browser'],
      repeatability:
        'Each committed filter result revision is new.',
      eventTime: 'The result-commit timestamp.',
      prerequisites: [
        'interaction_id',
        'result_revision',
        'safe filter keys',
        'result count'
      ]
    },
    dedupe: dedupe(
      'interaction_id + result_revision',
      'A separate committed filter interaction receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('filter_apply', {
      googleRequired: ['filter_name', 'filter_value']
    })
  },
  sort_apply: {
    version: 1,
    name: 'sort_apply',
    lifecycle: 'active',
    owner: 'storefront_product_sort',
    trigger: {
      description:
        'Create after the selected sort has produced and committed an updated product result revision.',
      sources: ['browser'],
      repeatability:
        'Each committed sort result revision is new.',
      eventTime: 'The result-commit timestamp.',
      prerequisites: [
        'interaction_id',
        'result_revision',
        'sort key',
        'result count'
      ]
    },
    dedupe: dedupe(
      'interaction_id + result_revision',
      'A separate committed sort interaction receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('sort_apply', {
      googleRequired: ['sort_key']
    })
  },
  variant_select: {
    version: 1,
    name: 'variant_select',
    lifecycle: 'active',
    owner: 'storefront_variant_controller',
    trigger: {
      description:
        'Create after the selected variant is resolved and committed to the product state.',
      sources: ['browser'],
      repeatability: 'Each committed variant selection is new.',
      eventTime: 'The variant-state commit timestamp.',
      prerequisites: [
        'interaction_id',
        'product_id',
        'variant_id',
        'availability'
      ]
    },
    dedupe: dedupe(
      'interaction_id + variant_id',
      'A separate committed variant selection receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('variant_select', {
      googleRequired: ['item_id', 'item_variant']
    })
  },
  size_guide_view: {
    version: 1,
    name: 'size_guide_view',
    lifecycle: 'active',
    owner: 'storefront_size_guide',
    trigger: {
      description:
        'Create when the requested size-guide dialog or surface is actually visible.',
      sources: ['browser'],
      repeatability: 'Each qualifying open sequence is new.',
      eventTime: 'The qualifying visibility timestamp.',
      prerequisites: [
        'page_view_id',
        'guide_id',
        'open_sequence'
      ]
    },
    dedupe: dedupe(
      'page_view_id + guide_id + open_sequence',
      'A later qualifying guide-open sequence receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('size_guide_view', {
      googleRequired: ['guide_id'],
      firstPartyRequired: ['page_view_id', 'guide_id']
    })
  },
  checkout_error: {
    version: 1,
    name: 'checkout_error',
    lifecycle: 'blocked_source',
    owner: 'authoritative_checkout_error_source',
    trigger: {
      description:
        'Create only when an approved authoritative checkout source reports a definitive checkout failure.',
      sources: ['browser', 'server'],
      repeatability: 'Each failed checkout attempt is new.',
      eventTime: 'The authoritative failure timestamp.',
      prerequisites: [
        'approved authoritative source',
        'checkout_attempt_id',
        'safe error category'
      ]
    },
    dedupe: dedupe(
      'checkout_attempt_id',
      'A separate failed checkout attempt receives a new event_id.',
      retain90Days
    ),
    consent: errorConsent,
    providers: plannedProviders('checkout_error', {
      firstPartyConsentRequirement: 'analytics_or_operational',
      googleRequired: ['error_category']
    })
  },
  payment_error: {
    version: 1,
    name: 'payment_error',
    lifecycle: 'blocked_source',
    owner: 'authoritative_payment_error_source',
    trigger: {
      description:
        'Create only when an approved authoritative payment source reports a definitive payment failure.',
      sources: ['browser', 'server'],
      repeatability: 'Each failed payment attempt is new.',
      eventTime: 'The authoritative failure timestamp.',
      prerequisites: [
        'approved authoritative source',
        'payment_attempt_id',
        'safe error category'
      ]
    },
    dedupe: dedupe(
      'payment_attempt_id',
      'A separate failed payment attempt receives a new event_id.',
      retain90Days
    ),
    consent: errorConsent,
    providers: plannedProviders('payment_error', {
      firstPartyConsentRequirement: 'analytics_or_operational',
      googleRequired: ['error_category']
    })
  },
  scroll_depth: {
    version: 1,
    name: 'scroll_depth',
    lifecycle: 'active',
    owner: 'storefront_scroll_observer',
    trigger: {
      description:
        'Create once as each explicit 25, 50, 75, or 90 percent depth threshold is crossed.',
      sources: ['browser'],
      repeatability: 'Once per page view and threshold.',
      eventTime: 'The first threshold-crossing timestamp.',
      prerequisites: [
        'page_view_id',
        'threshold',
        'document height'
      ]
    },
    dedupe: dedupe(
      'page_view_id + threshold',
      'A new page view or newly crossed threshold receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('scroll_depth', {
      googleRequired: ['percent_scrolled'],
      firstPartyRequired: ['page_view_id', 'threshold'],
      meta: {
        eventName: 'LandingScrollDepth',
        requiredParameters: [
          'threshold',
          'percent_scrolled',
          'document_height'
        ]
      }
    })
  },
  view_category: {
    version: 1,
    name: 'view_category',
    lifecycle: 'active',
    owner: 'storefront_category_surface',
    trigger: {
      description:
        'Create when a category or collection surface is actually visible.',
      sources: ['browser'],
      repeatability:
        'Once per page view, category, and view sequence.',
      eventTime: 'The qualifying category-visibility timestamp.',
      prerequisites: [
        'page_view_id',
        'category_id',
        'category_name',
        'view_sequence'
      ]
    },
    dedupe: dedupe(
      'page_view_id + category_id + view_sequence',
      'A new page view or newly qualifying category view sequence receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('view_category', {
      googleRequired: ['category_id', 'category_name'],
      firstPartyRequired: [
        'page_view_id',
        'category_id',
        'category_name',
        'view_sequence'
      ],
      meta: {
        eventName: 'ViewCategory',
        requiredParameters: [
          'category_id',
          'category_name',
          'view_sequence'
        ]
      },
      pinterest: {
        eventName: 'view_category',
        requiredParameters: ['content_category']
      }
    })
  },
  hero_interact: {
    version: 1,
    name: 'hero_interact',
    lifecycle: 'active',
    owner: 'storefront_hero_cta',
    trigger: {
      description:
        'Create when the homepage hero CTA (Se mer / ReadMoreHeroClick) is clicked.',
      sources: ['browser'],
      repeatability:
        'Once per page view, CTA, and click sequence.',
      eventTime: 'The hero CTA click timestamp.',
      prerequisites: [
        'page_view_id',
        'cta_id',
        'destination_path',
        'click_sequence'
      ]
    },
    dedupe: dedupe(
      'page_view_id + cta_id + click_sequence',
      'A new page view or newly qualifying hero CTA click sequence receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('hero_interact', {
      googleRequired: ['cta_id', 'destination_path'],
      firstPartyRequired: [
        'page_view_id',
        'cta_id',
        'destination_path',
        'click_sequence'
      ],
      meta: {
        eventName: 'HeroInteract',
        requiredParameters: [
          'cta_id',
          'destination_path',
          'click_sequence'
        ]
      }
    })
  },
  interact_with_accordion: {
    version: 1,
    name: 'interact_with_accordion',
    lifecycle: 'active',
    owner: 'product_details_accordion',
    trigger: {
      description:
        'Create after a user opens a previously closed PDP product-details accordion.',
      sources: ['browser'],
      repeatability:
        'Each user-triggered closed-to-open transition receives a new interaction sequence.',
      eventTime: 'The user-triggered open timestamp.',
      prerequisites: [
        'page_view_id',
        'resolved product and variant',
        'accordion_id',
        'accordion title',
        'interaction_sequence'
      ]
    },
    dedupe: dedupe(
      'page_view_id + product_id + variant_id + accordion_id + interaction_sequence',
      'A later closed-to-open interaction receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('interact_with_accordion', {
      commerce: true,
      firstPartyRequired: [
        'page_view_id',
        'accordion_id',
        'interaction_type',
        'items'
      ],
      googleRequired: [
        'accordion_id',
        'accordion_title',
        'interaction_type',
        'items'
      ],
      meta: {
        eventName: 'InteractWithAccordion',
        requiredParameters: [
          'content_ids',
          'contents',
          'accordion_id',
          'accordion_title',
          'interaction_type'
        ]
      },
      microsoft: {
        eventName: 'interact_with_accordion',
        requiredParameters: ['items', 'accordion_id']
      }
    })
  },
  open_quick_view: {
    version: 1,
    name: 'open_quick_view',
    lifecycle: 'active',
    owner: 'product_quick_view_dialog',
    trigger: {
      description:
        'Create only after the quick-view dialog is open and its product and selected variant are resolved.',
      sources: ['browser'],
      repeatability:
        'Each successfully opened, resolved dialog receives a new open sequence.',
      eventTime: 'The resolved open-dialog timestamp.',
      prerequisites: [
        'page_view_id',
        'source_surface',
        'open_sequence',
        'resolved product and selected variant'
      ]
    },
    dedupe: dedupe(
      'page_view_id + source_surface + product_id + variant_id + open_sequence',
      'A later successful dialog open receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('open_quick_view', {
      commerce: true,
      firstPartyRequired: [
        'page_view_id',
        'source_surface',
        'open_sequence',
        'items'
      ],
      googleRequired: [
        'source_surface',
        'open_sequence',
        'items'
      ],
      meta: {
        eventName: 'OpenQuickView',
        requiredParameters: [
          'content_ids',
          'contents',
          'currency',
          'value',
          'source_surface',
          'open_sequence'
        ]
      },
      microsoft: {
        eventName: 'open_quick_view',
        requiredParameters: ['items', 'source_surface']
      }
    })
  },
  video_progress: {
    version: 1,
    name: 'video_progress',
    lifecycle: 'active',
    owner: 'storefront_video_controller',
    trigger: {
      description:
        'Create once as each explicit 10, 25, 50, 75, 90, or 100 percent video milestone is crossed.',
      sources: ['browser'],
      repeatability: 'Once per page view, video, and milestone.',
      eventTime: 'The first milestone-crossing timestamp.',
      prerequisites: [
        'page_view_id',
        'video_id',
        'video duration',
        'milestone'
      ]
    },
    dedupe: dedupe(
      'page_view_id + video_id + milestone',
      'A new page view, video, or newly crossed milestone receives a new event_id.',
      retain30Days
    ),
    consent: behaviorConsent,
    providers: activeEventProviders('video_progress', {
      googleRequired: [
        'video_current_time',
        'video_duration',
        'video_percent',
        'video_title'
      ],
      firstPartyRequired: [
        'page_view_id',
        'video_id',
        'milestone'
      ]
    })
  },
  meta_app_event: {
    version: 1,
    name: 'meta_app_event',
    lifecycle: 'active',
    owner: 'trusted_meta_app_event_ingest',
    trigger: {
      description:
        'Accept an event only after the native app has observed it and supplied the complete Meta app-event contract.',
      sources: ['server'],
      repeatability:
        'Once per original app event_id; retries reuse the same source event_id.',
      eventTime: 'The original app occurrence timestamp.',
      prerequisites: [
        'authenticated producer',
        'app marketing consent',
        'advertiser tracking state',
        'exact 16-value app_data.extinfo',
        'original event_id and event_time'
      ]
    },
    dedupe: dedupe(
      'source_type + source event_name + source event_id',
      'A genuinely new app occurrence receives a new source event_id.',
      retain25Months,
      false
    ),
    consent: metaAppConsent,
    providers: metaNonWebProviders('meta_app_event', {
      requiredParameters: [
        'advertiser_tracking_enabled',
        'app_data.extinfo'
      ],
      transport: 'meta_conversions_api_app'
    })
  },
  meta_offline_event: {
    version: 1,
    name: 'meta_offline_event',
    lifecycle: 'active',
    owner: 'trusted_meta_offline_event_ingest',
    trigger: {
      description:
        'Accept an event only after an offline system has observed a physical-store occurrence with customer match evidence.',
      sources: ['server'],
      repeatability:
        'Once per original offline event_id; retries reuse the same source event_id.',
      eventTime:
        'The original physical-store occurrence timestamp, no older than seven days at ingestion.',
      prerequisites: [
        'authenticated producer',
        'offline marketing consent',
        'observed customer match key',
        'original event_id and event_time',
        'Purchase order_id, currency, value and contents when applicable'
      ]
    },
    dedupe: dedupe(
      'source_type + source event_name + source event_id',
      'A genuinely new physical-store occurrence receives a new source event_id.',
      retain25Months,
      false
    ),
    consent: metaOfflineConsent,
    providers: metaNonWebProviders('meta_offline_event', {
      requiredParameters: [
        'customer_match_key',
        'order_id',
        'currency',
        'value',
        'contents'
      ],
      transport: 'meta_conversions_api_offline'
    })
  }
} as const satisfies Record<string, EventCatalogEntryBase>

export const eventSignalProfiles = {
  page_view: 'website',
  view_item_list: 'website',
  select_item: 'website',
  view_item: 'website',
  add_to_wishlist: 'website',
  add_to_cart: 'server_mutation',
  remove_from_cart: 'server_mutation',
  view_cart: 'website',
  begin_checkout: 'server_mutation',
  add_shipping_info: 'blocked_browser',
  add_payment_info: 'blocked_browser',
  purchase: 'transaction_attribution',
  refund: 'transaction_attribution',
  search: 'website',
  view_search_results: 'website',
  view_promotion: 'website',
  select_promotion: 'website',
  generate_lead: 'server_mutation',
  form_start: 'website',
  form_submit: 'server_mutation',
  form_error: 'server_mutation',
  filter_apply: 'website',
  sort_apply: 'website',
  variant_select: 'website',
  size_guide_view: 'website',
  checkout_error: 'blocked_mixed',
  payment_error: 'blocked_mixed',
  scroll_depth: 'website',
  view_category: 'website',
  hero_interact: 'website',
  interact_with_accordion: 'website',
  open_quick_view: 'website',
  video_progress: 'website',
  meta_app_event: 'meta_non_web',
  meta_offline_event: 'meta_non_web'
} as const satisfies {
  readonly [K in keyof typeof eventCatalogBase]: EventSignalProfile
}

export const eventCatalog = attachEventSignalContracts(
  eventCatalogBase,
  eventSignalProfiles
)

export type CatalogEventName = keyof typeof eventCatalog

export const canonicalEventNames = Object.freeze(
  Object.keys(eventCatalog) as CatalogEventName[]
)

export function getEventCatalogEntry(
  name: CatalogEventName
): (typeof eventCatalog)[CatalogEventName] {
  return eventCatalog[name]
}
