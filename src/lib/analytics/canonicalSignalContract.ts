import { z } from 'zod'

export const canonicalClickIdsSchema = z.strictObject({
  dclid: z.string().min(1).optional(),
  epik: z.string().min(1).optional(),
  fbclid: z.string().min(1).optional(),
  gbraid: z.string().min(1).optional(),
  gclid: z.string().min(1).optional(),
  msclkid: z.string().min(1).optional(),
  sc_click_id: z.string().min(1).optional(),
  ttclid: z.string().min(1).optional(),
  twclid: z.string().min(1).optional(),
  wbraid: z.string().min(1).optional()
})

export type CanonicalClickIds = z.infer<
  typeof canonicalClickIdsSchema
>

export const canonicalSignalNames = [
  'event_source_url',
  'client_ip_address',
  'client_user_agent',
  'external_id',
  'click_ids',
  'meta_fbclid',
  'meta_fbc',
  'meta_fbp'
] as const

export type CanonicalSignalName =
  (typeof canonicalSignalNames)[number]

export const canonicalSignalSourceSchema = z.enum([
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

export type CanonicalSignalSource = z.infer<
  typeof canonicalSignalSourceSchema
>

export const canonicalSignalUnavailableReasonSchema = z.enum([
  'consent_denied',
  'not_observed',
  'no_applicable_click',
  'not_applicable',
  'untrusted_source',
  'expired',
  'missing_attribution_snapshot'
])

export type CanonicalSignalUnavailableReason = z.infer<
  typeof canonicalSignalUnavailableReasonSchema
>

export const canonicalSignalAuditEntrySchema =
  z.discriminatedUnion('state', [
    z.strictObject({
      state: z.literal('present'),
      source: canonicalSignalSourceSchema,
      captured_at: z.iso.datetime({ offset: true })
    }),
    z.strictObject({
      state: z.literal('unavailable'),
      reason: canonicalSignalUnavailableReasonSchema,
      assessed_at: z.iso.datetime({ offset: true })
    })
  ])
export type CanonicalSignalAuditEntry = z.infer<
  typeof canonicalSignalAuditEntrySchema
>

export const canonicalSignalAuditSchema = z.strictObject({
  event_source_url: canonicalSignalAuditEntrySchema,
  client_ip_address: canonicalSignalAuditEntrySchema,
  client_user_agent: canonicalSignalAuditEntrySchema,
  external_id: canonicalSignalAuditEntrySchema,
  click_ids: canonicalSignalAuditEntrySchema,
  meta_fbclid: canonicalSignalAuditEntrySchema,
  meta_fbc: canonicalSignalAuditEntrySchema,
  meta_fbp: canonicalSignalAuditEntrySchema
})

export type CanonicalSignalAudit = z.infer<
  typeof canonicalSignalAuditSchema
>

export const canonicalSignalRequirementSchema = z.enum([
  'required',
  'required_when_marketing_granted',
  'required_when_observed',
  'required_from_attribution_snapshot',
  'not_applicable'
])

export type CanonicalSignalRequirement = z.infer<
  typeof canonicalSignalRequirementSchema
>

export type CanonicalSignalRule = Readonly<{
  requirement: CanonicalSignalRequirement
  allowedSources: readonly CanonicalSignalSource[]
  allowedUnavailableReasons: readonly CanonicalSignalUnavailableReason[]
}>

export type CanonicalEventSignalPolicy = Readonly<
  Record<CanonicalSignalName, CanonicalSignalRule>
>

export const providerSignalDeliveryRuleSchema = z.enum([
  'required',
  'send_when_available',
  'send_when_supported_and_permitted',
  'derive_to_provider_format',
  'persist_canonical',
  'not_applicable'
])

export type ProviderSignalDeliveryRule = z.infer<
  typeof providerSignalDeliveryRuleSchema
>

export type ProviderSignalDeliveryPolicy = Readonly<
  Record<CanonicalSignalName, ProviderSignalDeliveryRule>
>

export function presentCanonicalSignal(
  source: CanonicalSignalSource,
  capturedAt: string
): CanonicalSignalAuditEntry {
  return canonicalSignalAuditEntrySchema.parse({
    state: 'present',
    source,
    captured_at: capturedAt
  })
}

export function unavailableCanonicalSignal(
  reason: CanonicalSignalUnavailableReason,
  assessedAt: string
): CanonicalSignalAuditEntry {
  return canonicalSignalAuditEntrySchema.parse({
    state: 'unavailable',
    reason,
    assessed_at: assessedAt
  })
}
