import { z } from 'zod'

const audienceRefSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string().optional()
  })
  .passthrough()

const targetingSchema = z
  .object({
    age_min: z.number().optional(),
    age_max: z.number().optional(),
    age_range: z.array(z.number()).optional(),
    targeting_optimization: z.string().optional(),
    targeting_automation: z
      .object({
        advantage_audience: z.union([z.number(), z.string()]).optional(),
        individual_setting: z
          .object({
            age: z.number().optional(),
            gender: z.number().optional()
          })
          .passthrough()
          .optional()
      })
      .passthrough()
      .optional(),
    targeting_relaxation_types: z
      .object({
        lookalike: z.number().optional(),
        custom_audience: z.number().optional()
      })
      .passthrough()
      .optional(),
    geo_locations: z
      .object({
        countries: z.array(z.string()).optional()
      })
      .passthrough()
      .optional(),
    excluded_geo_locations: z.unknown().optional(),
    custom_audiences: z.array(audienceRefSchema).optional(),
    excluded_custom_audiences: z.array(audienceRefSchema).optional(),
    flexible_spec: z.unknown().optional()
  })
  .passthrough()

function flag(value: unknown) {
  if (value === 1 || value === '1') return true
  if (value === 0 || value === '0') return false
  return null
}

function refs(
  rows:
    | ReadonlyArray<{ id: string | number; name?: string | undefined }>
    | undefined
) {
  return (rows ?? []).map(row => ({
    id: String(row.id),
    name: row.name ?? null
  }))
}

export function parseMetaInsightsTargeting(value: unknown) {
  if (value === undefined || value === null) return null
  const targeting = targetingSchema.parse(value)
  const automation = targeting.targeting_automation
  return {
    advantageAudience: flag(automation?.advantage_audience),
    ageMin: targeting.age_min ?? null,
    ageMax: targeting.age_max ?? null,
    ageRange: targeting.age_range ?? null,
    countries: targeting.geo_locations?.countries ?? [],
    excludedGeoLocations: targeting.excluded_geo_locations ?? null,
    targetingOptimization: targeting.targeting_optimization ?? null,
    ageSuggestion: flag(automation?.individual_setting?.age),
    genderSuggestion: flag(automation?.individual_setting?.gender),
    relaxLookalike: flag(targeting.targeting_relaxation_types?.lookalike),
    relaxCustomAudience: flag(
      targeting.targeting_relaxation_types?.custom_audience
    ),
    customAudiences: refs(targeting.custom_audiences),
    excludedCustomAudiences: refs(targeting.excluded_custom_audiences),
    flexibleSpec: targeting.flexible_spec ?? null,
    raw: targeting
  }
}

export type MetaInsightsTargetingSummary = NonNullable<
  ReturnType<typeof parseMetaInsightsTargeting>
>
