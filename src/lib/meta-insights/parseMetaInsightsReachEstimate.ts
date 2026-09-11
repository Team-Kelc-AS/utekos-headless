import { z } from 'zod'

const estimateSchema = z
  .object({
    users_lower_bound: z.number().optional(),
    users_upper_bound: z.number().optional(),
    estimate_ready: z.boolean().optional()
  })
  .passthrough()

const bodySchema = z
  .object({
    data: z.union([estimateSchema, z.array(estimateSchema)])
  })
  .passthrough()

export function parseMetaInsightsReachEstimate(value: unknown) {
  const parsed = bodySchema.parse(value)
  const row = Array.isArray(parsed.data) ? parsed.data[0] : parsed.data
  if (!row) {
    throw new Error('Meta reachestimate returned no data')
  }
  return {
    usersLowerBound: row.users_lower_bound ?? null,
    usersUpperBound: row.users_upper_bound ?? null,
    estimateReady: row.estimate_ready ?? null
  }
}
