import { z } from 'zod'

export const providerIdSchema = z.enum([
  'supabase',
  'google',
  'meta',
  'microsoft_uet',
  'pinterest',
  'snapchat'
])
const support = z.enum([
  'supported',
  'planned',
  'not_relevant',
  'blocked'
])
const productionStatus = z.enum([
  'active',
  'planned',
  'blocked',
  'not_implemented',
  'not_relevant'
])
const consentRequirement = z.enum([
  'analytics',
  'marketing',
  'analytics_or_marketing',
  'analytics_or_operational',
  'operational',
  'none'
])
const signalName = z.enum([
  'event_source_url',
  'client_ip_address',
  'client_user_agent',
  'external_id',
  'click_ids',
  'meta_fbclid',
  'meta_fbc',
  'meta_fbp'
])
const transport = z.enum([
  'google_tag_manager',
  'shopify_customer_events',
  'meta_pixel',
  'microsoft_uet',
  'pinterest_tag',
  'snap_pixel',
  'first_party_api',
  'server_side_gtm',
  'google_data_manager',
  'meta_conversions_api',
  'meta_conversions_api_app',
  'meta_conversions_api_offline',
  'microsoft_uet_capi',
  'pinterest_conversions_api',
  'snap_conversions_api_v3'
])
const signalDelivery = z.enum([
  'required',
  'send_when_available',
  'send_when_supported_and_permitted',
  'derive_to_provider_format',
  'persist_canonical',
  'not_applicable'
])
const signalRule = z.strictObject({
  requirement: z.enum([
    'required',
    'required_when_marketing_granted',
    'required_when_observed',
    'required_from_attribution_snapshot',
    'not_applicable'
  ]),
  allowedSources: z.array(
    z.enum([
      'browser_request_url',
      'browser_document',
      'first_party_cookie',
      'durable_click_id_store',
      'first_party_external_id_cookie',
      'vercel_request_context',
      'server_request',
      'verified_shopify_webhook',
      'checkout_attribution_snapshot',
      'shopify_order_attribute',
      'meta_parameter_builder'
    ])
  ),
  allowedUnavailableReasons: z.array(
    z.enum([
      'consent_denied',
      'not_observed',
      'no_applicable_click',
      'not_applicable',
      'untrusted_source',
      'expired',
      'missing_attribution_snapshot'
    ])
  )
})
const provider = z.strictObject({
  support,
  eventName: z.string().nullable(),
  transport: z.strictObject({
    browser: transport.nullable(),
    server: transport.nullable()
  }),
  requiredParameters: z.array(z.string()),
  dedupeField: z.string().nullable(),
  consentRequirement,
  adapterVersion: z.number().int().nullable(),
  productionStatus,
  productionDetail: z.string(),
  serverOutbox: z.enum([
    'active',
    'disabled',
    'blocked_no_worker'
  ]),
  signalDelivery: z.record(signalName, signalDelivery)
})
const basis = z.enum(['analytics', 'marketing', 'operational'])
export const catalogPolicySchema = z.strictObject({
  version: z.literal(1),
  name: z.string(),
  lifecycle: z.enum(['active', 'planned', 'blocked_source']),
  owner: z.string(),
  trigger: z.strictObject({
    description: z.string(),
    sources: z.array(z.enum(['browser', 'server', 'webhook'])),
    repeatability: z.string(),
    eventTime: z.string(),
    prerequisites: z.array(z.string())
  }),
  dedupe: z.strictObject({
    eventId: z.string(),
    reuse: z.string(),
    newEvent: z.string(),
    ledgerIdempotencyKey: z.string(),
    providerIdempotencyKey: z.string(),
    browserServerShareEventId: z.boolean(),
    retention: z.strictObject({
      value: z.number(),
      unit: z.enum(['day', 'month', 'year']),
      scope: z.literal('dedupe_key_only')
    })
  }),
  consent: z.strictObject({
    browserCreation: z.enum([
      'local_ephemeral_allowed',
      'after_authoritative_response',
      'authoritative_server_source'
    ]),
    firstPartyCollection: z.array(basis),
    canonicalLedger: z.array(basis),
    analyticsExport: z.array(z.literal('analytics')),
    marketingExport: z.array(z.literal('marketing')),
    googleCookielessPing: z.enum([
      'allowed_by_consent_mode',
      'not_applicable'
    ]),
    operationalPurpose: z.enum([
      'none',
      'commerce_mutation',
      'order_accounting',
      'lead_fulfilment',
      'error_diagnostics'
    ]),
    piiPolicy: z.literal(
      'consent_gated_provider_identifiers_only'
    )
  }),
  providers: z.record(providerIdSchema, provider),
  signals: z.record(signalName, signalRule)
})

const delivery = z.strictObject({
  transport,
  status: z.enum([
    'implemented',
    'active',
    'disabled',
    'blocked_no_worker'
  ]),
  parameterContract: z.strictObject({
    parameterSets: z.array(z.string()),
    logicalRequiredParameters: z.array(z.string())
  })
})
export const providerMappingsSchema = z.record(
  providerIdSchema,
  z.strictObject({
    support,
    eventName: z.string().nullable(),
    productionStatus,
    productionDetail: z.string(),
    consentRequirement,
    dedupeField: z.string().nullable(),
    browser: delivery.nullable(),
    server: delivery.nullable()
  })
)
