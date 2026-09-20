import { z } from 'zod'
import {
  controlAuthorizationSchema,
  controlCollectorSchema,
  controlDefinitionSchema,
  controlPipelineSchema,
  controlSourceSchema
} from './controlDefinition'

export const controlResultSchema = z.strictObject({
  result_version: z.literal('canonical-event-context.v2'),
  manifest_version: z.literal('canonical-event-manifest.v1'),
  manifest_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  deployment_sha: z.string().nullable(),
  tracking_authorization: controlAuthorizationSchema,
  inventory: z.array(
    z.strictObject({
      name: z.string(),
      membership: z.literal('canonical')
    })
  ),
  catalog_only: z.array(
    z.strictObject({
      name: z.string(),
      membership: z.literal('catalog_only')
    })
  ),
  contexts: z
    .array(
      z.strictObject({
        definition: controlDefinitionSchema,
        pipeline: controlPipelineSchema.extend({
          collector: controlCollectorSchema
        })
      })
    )
    .max(5),
  total_matches: z.number().int().nonnegative(),
  truncated: z.boolean(),
  sources: z.array(controlSourceSchema),
  limitations: z.array(z.string()),
  live_evidence: z.literal('not_queried')
})
export type ControlResult = z.infer<typeof controlResultSchema>
