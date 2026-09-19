import { z } from 'zod'

export const controlResultSchema = z.object({
  manifest_version: z.string(),
  manifest_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  deployment_sha: z.string().nullable(),
  tracking_authorization: z.record(z.string(), z.unknown()),
  inventory: z.array(
    z.object({
      name: z.string(),
      membership: z.literal('canonical')
    })
  ),
  catalog_only: z.array(
    z.object({
      name: z.string(),
      membership: z.literal('catalog_only')
    })
  ),
  contexts: z.array(
    z.object({
      definition: z.object({ name: z.string() }).passthrough(),
      pipeline: z.record(z.string(), z.unknown())
    })
  ),
  total_matches: z.number().int().nonnegative(),
  truncated: z.boolean(),
  sources: z.array(
    z.object({ path: z.string(), sha256: z.string() })
  ),
  limitations: z.array(z.string()),
  live_evidence: z.literal('not_queried')
})
export type ControlResult = z.infer<typeof controlResultSchema>
