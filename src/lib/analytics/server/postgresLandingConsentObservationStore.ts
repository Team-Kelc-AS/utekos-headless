import 'server-only'
import postgres from 'postgres'
import type { LandingConsentObservationStore } from './handleLandingConsentObservationRequest'

let trackingSql: ReturnType<typeof postgres> | undefined

function getTrackingSql() {
  const connectionString =
    process.env.SUPABASE_VERCEL_POSTGRES_URL ??
    process.env.SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING

  if (!connectionString) {
    throw new Error(
      'Missing tracking database connection string'
    )
  }

  trackingSql ??= postgres(connectionString, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 1,
    max_lifetime: 60 * 30,
    prepare: false
  })

  return trackingSql
}

export const postgresLandingConsentObservationStore: LandingConsentObservationStore =
  {
    upsert: async row => {
      const stored = await getTrackingSql()`
        insert into ops.landing_consent_observations (
          edge_request_id,
          page_view_id,
          analytics_granted,
          marketing_granted,
          preferences_granted,
          decision,
          source,
          traffic_classification,
          observation_count,
          observed_at,
          updated_at
        ) values (
          ${row.edgeRequestId},
          ${row.pageViewId},
          ${row.analyticsGranted},
          ${row.marketingGranted},
          ${row.preferencesGranted},
          ${row.decision},
          'cookiebot',
          ${row.trafficClassification},
          1,
          now(),
          now()
        )
        on conflict (edge_request_id) do update
        set
          page_view_id = excluded.page_view_id,
          analytics_granted = excluded.analytics_granted,
          marketing_granted = excluded.marketing_granted,
          preferences_granted = excluded.preferences_granted,
          decision = excluded.decision,
          traffic_classification = excluded.traffic_classification,
          observation_count =
            ops.landing_consent_observations.observation_count + 1,
          updated_at = now()
        where
          ops.landing_consent_observations.page_view_id =
            excluded.page_view_id
          and ops.landing_consent_observations.observation_count < 4
        returning edge_request_id
      `

      return stored.length === 1
    }
  }
