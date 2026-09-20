import { z } from 'zod'
import {
  catalogPolicySchema,
  providerMappingsSchema
} from './catalogPolicySchema'
import { jsonSchemaDocument } from './jsonSchemaDocument'

export const controlSourceSchema = z.strictObject({
  path: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/)
})
export const controlAuthorizationSchema = z.strictObject({
  mode: z.literal('operator_policy'),
  version: z.literal('operator-policy-v1'),
  authorization: z.strictObject({
    analytics: z.literal('granted'),
    marketing: z.literal('granted'),
    preferences: z.literal('granted')
  }),
  cookiebot_state: z.literal(
    'not_used_for_tracking_authorization'
  )
})
export const controlCollectorSchema = z.strictObject({
  route: z.string().min(1).nullable(),
  source_files: z.array(z.string().min(1)).min(1)
})
export const controlBindingSchema = z.strictObject({
  key: z.string(),
  registry: z.string(),
  implementation: z.strictObject({
    path: z.string(),
    symbol: z.string()
  })
})
export const controlPipelineSchema = z.strictObject({
  evidence: z.literal('source_only'),
  queue_topic: z.string().min(1),
  stages: z.array(
    z.strictObject({ stage: z.string(), source: z.string() })
  ),
  adapters: z.array(controlBindingSchema),
  workers: z.array(controlBindingSchema)
})
const controlMicrosoftCommerceRuleSchema = z.strictObject({
  id: z.string().min(1),
  kind: z.literal('microsoft_commerce'),
  event: z.enum(['add_to_cart', 'purchase']),
  provider: z.literal('microsoft_uet'),
  browser_event_name: z.string().min(1).nullable(),
  server_event_name: z.string().min(1),
  transaction_id_source: z.enum([
    'cart_mutation_id',
    'transaction_id'
  ]),
  transaction_id_targets: z.tuple([
    z.literal('customData.transactionId'),
    z.literal('customData.eventLabel')
  ]),
  item_price_sources: z
    .array(z.enum(['final_unit_price', 'unit_price']))
    .min(1)
    .max(2),
  item_price_target: z.literal('customData.items[].price'),
  selection: z.literal('first_non_nullish'),
  source: z.string().min(1)
})
const controlProviderEventMappingRuleSchema = z.strictObject({
  id: z.string().min(1),
  kind: z.literal('provider_event_mapping'),
  event: z.enum(['add_to_cart', 'purchase']),
  provider: z.enum([
    'google',
    'meta',
    'microsoft_uet',
    'pinterest',
    'snapchat'
  ]),
  browser_event_name: z.string().min(1).nullable(),
  server_event_name: z.string().min(1).nullable(),
  source: z.string().min(1),
  source_symbol: z.string().min(1)
})
const controlProviderDispatchRuleSchema = z.strictObject({
  id: z.string().min(1),
  kind: z.literal('provider_dispatch'),
  event: z.enum(['add_to_cart', 'purchase']),
  provider: z.enum([
    'supabase',
    'google',
    'meta',
    'microsoft_uet',
    'pinterest',
    'snapchat'
  ]),
  lifecycle: z.literal('active'),
  support: z.literal('supported'),
  consent_requirement: z.enum([
    'analytics',
    'marketing',
    'analytics_or_marketing',
    'operational'
  ]),
  production_status: z.literal('active'),
  server_outbox: z.enum(['active', 'disabled']),
  source: z.literal('src/lib/analytics/eventCatalog.ts'),
  source_symbol: z.literal('eventCatalog')
})
export const controlRuntimeRuleSchema = z.discriminatedUnion(
  'kind',
  [
    controlMicrosoftCommerceRuleSchema,
    controlProviderEventMappingRuleSchema,
    controlProviderDispatchRuleSchema
  ]
)
export const controlConnectionSchema = z.strictObject({
  from: z.strictObject({ path: z.string(), symbol: z.string() }),
  to: z.strictObject({ path: z.string(), symbol: z.string() }),
  relation: z.enum([
    'calls',
    'dispatches',
    'maps',
    'persists',
    'plans',
    'reads_definition',
    'registers',
    'sends',
    'uses_dependencies',
    'uses_mapping'
  ]),
  evidence: z.literal('source_verified')
})
export const controlDefinitionSchema = z.strictObject({
  name: z.string().min(1),
  membership: z.literal('canonical'),
  schema: z.strictObject({
    source: z.string().min(1),
    json_schema: jsonSchemaDocument
  }),
  contract: controlCollectorSchema,
  policy: catalogPolicySchema,
  provider_mappings: providerMappingsSchema,
  parameter_lineage: z.array(
    z.strictObject({
      provider: z.string().min(1),
      delivery: z.enum(['browser', 'server']),
      target_parameter: z.string().min(1),
      authority: z.enum(['runtime_rule', 'catalog_declaration']),
      runtime_rule_id: z.string().min(1).nullable(),
      source: z.string().min(1),
      requirement: z.enum([
        'required',
        'conditional',
        'recommended',
        'optional'
      ]),
      rule: z.string().min(1)
    })
  ),
  runtime_contract: z.strictObject({
    coverage: z.enum([
      'not_migrated',
      'pilot_event_runtime_and_provider_connections'
    ]),
    rules: z.array(controlRuntimeRuleSchema),
    connections: z.array(controlConnectionSchema),
    remaining_metadata: z.literal(
      'catalog_declarations_not_runtime_verified'
    )
  }),
  evidence: z.strictObject({
    static: z.literal('static_verified'),
    runtime: z.literal('not_queried'),
    provider_accepted: z.literal('not_queried'),
    provider_reported: z.literal('not_queried')
  })
})
