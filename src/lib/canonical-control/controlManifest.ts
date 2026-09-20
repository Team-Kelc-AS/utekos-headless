import { z } from 'zod'
import { catalogPolicySchema } from './catalogPolicySchema'
import {
  controlAuthorizationSchema,
  controlDefinitionSchema,
  controlPipelineSchema,
  controlSourceSchema
} from './controlDefinition'

export const canonicalEventManifestSchema = z.strictObject({
  manifest_version: z.literal('canonical-event-manifest.v1'),
  agent_contract: z.strictObject({
    path: z.literal(
      'contracts/events/canonical-event-manifest/v1/canonical-event-context.v2.schema.json'
    ),
    sha256: z.string().regex(/^[a-f0-9]{64}$/)
  }),
  source_of_truth: z.strictObject({
    statement: z.string().min(1),
    normative_sources: z.array(z.string().min(1)).min(1)
  }),
  tracking_authorization: controlAuthorizationSchema,
  evidence_statuses: z
    .array(
      z.enum([
        'static_verified',
        'runtime_observed',
        'provider_accepted',
        'provider_reported',
        'not_queried'
      ])
    )
    .min(1),
  generated_from: z.strictObject({
    source_files: z.array(controlSourceSchema).min(1)
  }),
  catalog_only: z.array(
    z.strictObject({
      name: z.string().min(1),
      membership: z.literal('catalog_only'),
      policy: catalogPolicySchema
    })
  ),
  limitations: z.array(z.string().min(1)),
  pipeline: controlPipelineSchema,
  events: z.array(controlDefinitionSchema).min(1)
})
export type ControlManifest = z.infer<
  typeof canonicalEventManifestSchema
>
