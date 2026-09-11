import { z } from 'zod'

const statusSchema = z
  .object({
    code: z.number().optional(),
    description: z.string().optional()
  })
  .passthrough()

export const metaInsightsCustomAudienceSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string().optional(),
    subtype: z.string().optional(),
    approximate_count_lower_bound: z.number().optional(),
    approximate_count_upper_bound: z.number().optional(),
    delivery_status: statusSchema.optional(),
    operation_status: statusSchema.optional(),
    lookalike_spec: z.unknown().optional(),
    time_created: z.number().optional(),
    time_updated: z.number().optional(),
    data_source: z.unknown().optional()
  })
  .passthrough()

export function parseMetaInsightsCustomAudience(value: unknown) {
  const parsed = metaInsightsCustomAudienceSchema.parse(value)
  return {
    id: String(parsed.id),
    name: parsed.name ?? null,
    subtype: parsed.subtype ?? null,
    approximateCountLower: parsed.approximate_count_lower_bound ?? null,
    approximateCountUpper: parsed.approximate_count_upper_bound ?? null,
    deliveryStatus: parsed.delivery_status ?? null,
    operationStatus: parsed.operation_status ?? null,
    lookalikeSpec: parsed.lookalike_spec ?? null,
    timeCreated: parsed.time_created ?? null,
    timeUpdated: parsed.time_updated ?? null,
    dataSource: parsed.data_source ?? null
  }
}
