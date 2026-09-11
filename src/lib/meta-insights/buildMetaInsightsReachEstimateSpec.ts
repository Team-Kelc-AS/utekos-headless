import type { MetaInsightsTargetingSummary } from './parseMetaInsightsTargeting'

export function buildMetaInsightsReachEstimateSpec(
  targeting: MetaInsightsTargetingSummary
) {
  if (targeting.countries.length === 0) return null

  const spec: Record<string, unknown> = {
    geo_locations: {
      countries: targeting.countries
    }
  }

  if (targeting.ageMin !== null) spec.age_min = targeting.ageMin
  if (targeting.ageMax !== null) spec.age_max = targeting.ageMax
  if (targeting.ageRange) spec.age_range = targeting.ageRange
  if (targeting.advantageAudience !== null) {
    spec.targeting_automation = {
      advantage_audience: targeting.advantageAudience ? 1 : 0
    }
  }
  if (targeting.customAudiences.length > 0) {
    spec.custom_audiences = targeting.customAudiences.map(row => ({
      id: row.id
    }))
  }
  if (targeting.excludedCustomAudiences.length > 0) {
    spec.excluded_custom_audiences = targeting.excludedCustomAudiences.map(
      row => ({ id: row.id })
    )
  }
  if (targeting.relaxLookalike !== null || targeting.relaxCustomAudience !== null) {
    spec.targeting_relaxation_types = {
      ...(targeting.relaxLookalike !== null
        ? { lookalike: targeting.relaxLookalike ? 1 : 0 }
        : {}),
      ...(targeting.relaxCustomAudience !== null
        ? { custom_audience: targeting.relaxCustomAudience ? 1 : 0 }
        : {})
    }
  }
  if (targeting.flexibleSpec !== null) {
    spec.flexible_spec = targeting.flexibleSpec
  }

  return spec
}
