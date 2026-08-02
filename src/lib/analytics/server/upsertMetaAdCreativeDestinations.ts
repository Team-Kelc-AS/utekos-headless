import 'server-only'

import postgres from 'postgres'
import type { MetaAdCreativeDestination } from './metaAdCreativeDestination'

let trackingSql: ReturnType<typeof postgres> | undefined

function getTrackingSql() {
  const connectionString =
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

export type MetaAdCreativeDestinationsUpsertInput = {
  destinations: MetaAdCreativeDestination[]
  observedAt: Date
}

export function validateMetaAdCreativeDestinationSnapshot(
  input: MetaAdCreativeDestinationsUpsertInput
) {
  if (input.destinations.length === 0) {
    throw new Error(
      'Refusing to persist an empty creative destination snapshot'
    )
  }

  const accountId = input.destinations[0]!.accountId
  const versionsByAd = new Map<string, string>()
  for (const destination of input.destinations) {
    if (destination.accountId !== accountId) {
      throw new Error(
        'Meta creative snapshot spans multiple accounts'
      )
    }
    const existingVersion = versionsByAd.get(destination.adId)
    if (
      existingVersion &&
      existingVersion !== destination.observedVersion
    ) {
      throw new Error(
        'Meta returned multiple observed versions for one ad'
      )
    }
    versionsByAd.set(
      destination.adId,
      destination.observedVersion
    )
  }

  return { accountId, versionsByAd }
}

export async function upsertMetaAdCreativeDestinations(
  input: MetaAdCreativeDestinationsUpsertInput
) {
  const { accountId, versionsByAd } =
    validateMetaAdCreativeDestinationSnapshot(input)

  return getTrackingSql().begin(async sql => {
    for (const [adId, observedVersion] of versionsByAd) {
      await sql`
        update marketing.meta_ad_creative_destinations
        set
          observed_through = greatest(observed_through, ${input.observedAt}),
          observed_until = ${input.observedAt},
          updated_at = ${input.observedAt}
        where account_id = ${accountId}
          and ad_id = ${adId}
          and observed_until is null
          and observed_version <> ${observedVersion}
      `
    }

    let upsertedCount = 0
    for (const destination of input.destinations) {
      const upserted = await sql`
        insert into marketing.meta_ad_creative_destinations (
          account_id,
          ad_id,
          creative_id,
          api_version,
          ad_created_time,
          ad_updated_time,
          effective_status,
          destination_url,
          normalized_destination_url,
          url_tags,
          source_kind,
          source_path,
          dynamic_resolution_status,
          destination_fingerprint,
          observed_version,
          observed_from,
          observed_through,
          observed_until,
          effective_from,
          effective_until,
          effective_period_basis,
          updated_at
        ) values (
          ${destination.accountId},
          ${destination.adId},
          ${destination.creativeId},
          'v25.0',
          ${destination.adCreatedTime},
          ${destination.adUpdatedTime},
          ${destination.effectiveStatus},
          ${destination.destinationUrl},
          ${destination.normalizedDestinationUrl},
          ${destination.urlTags},
          ${destination.sourceKind},
          ${destination.sourcePath},
          ${destination.dynamicResolutionStatus},
          ${destination.destinationFingerprint},
          ${destination.observedVersion},
          ${input.observedAt},
          ${input.observedAt},
          null,
          null,
          null,
          'unknown',
          ${input.observedAt}
        )
        on conflict (
          account_id,
          ad_id,
          creative_id,
          destination_fingerprint,
          observed_version
        ) do update set
          ad_created_time = excluded.ad_created_time,
          ad_updated_time = excluded.ad_updated_time,
          effective_status = excluded.effective_status,
          destination_url = excluded.destination_url,
          normalized_destination_url = excluded.normalized_destination_url,
          url_tags = excluded.url_tags,
          source_kind = excluded.source_kind,
          source_path = excluded.source_path,
          dynamic_resolution_status = excluded.dynamic_resolution_status,
          observed_through = excluded.observed_through,
          observed_until = null,
          updated_at = excluded.updated_at
        returning id
      `
      upsertedCount += upserted.length
    }

    return upsertedCount
  })
}
