import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { registrySnapshotSchema } from './registrySnapshotSchema'
import { resolveAudienceRegistryCredentials } from './resolveAudienceRegistryCredentials'

export async function persistAudienceRegistry(
  input: unknown,
  env: Record<string, string | undefined> = process.env
) {
  const report = registrySnapshotSchema.parse(input)
  const { url, key } = resolveAudienceRegistryCredentials(env)
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  }).schema('marketing')
  const hash = createHash('sha256')
    .update(JSON.stringify(report))
    .digest('hex')
  const prior = await db
    .from('meta_audience_registry_runs')
    .select('status,aggregate_report')
    .eq('run_id', report.runId)
    .maybeSingle()
  if (prior.error)
    throw new Error(
      `Registry preflight failed: ${prior.error.code}`
    )
  if (prior.data) {
    if (
      prior.data.status === 'complete' &&
      prior.data.aggregate_report?.snapshotHash === hash
    )
      return { runId: report.runId, status: 'already_complete' }
    throw new Error(
      'Existing incomplete or conflicting registry run; preserve it and audit again with a new run ID'
    )
  }
  const start = await db
    .from('meta_audience_registry_runs')
    .insert({
      run_id: report.runId,
      account_id: report.account.id.replace('act_', ''),
      api_version: report.graphApiVersion,
      observed_at: report.observedAt,
      status: 'building',
      aggregate_report: {
        snapshotHash: hash,
        sourceManifest: report.sourceManifest,
        buyerSnapshot: report.buyerSnapshot,
        localAudit: report.localAudit,
        legacySources: report.legacySources ?? [],
        ruleSets: report.ruleSets,
        blockers: report.blockers
      }
    })
  if (start.error)
    throw new Error(
      `Registry run insert failed: ${start.error.code}`
    )
  try {
    const segments = await db
      .from('meta_audience_segment_snapshots')
      .insert(
        report.segments.map(segment => ({
          run_id: report.runId,
          segment_key: segment.key,
          definition: segment.definition,
          planned_label: segment.label,
          source_manifest: report.sourceManifest.filter(
            source => source.segment === segment.key
          ),
          aggregate_counts:
            report.localAudit.segments.find(
              row => row.key === segment.key
            ) ?? {},
          audience_ids: segment.audienceIds
        }))
      )
    if (segments.error)
      throw new Error(
        `Segment insert failed: ${segments.error.code}`
      )
    const audiences = await db
      .from('meta_audience_snapshots')
      .insert(
        report.audiences.map(audience => ({
          run_id: report.runId,
          audience_id: audience.id,
          audience_name: audience.name,
          subtype: audience.subtype,
          labels: audience.audience_labels,
          is_value_based: audience.is_value_based ?? null,
          customer_file_source:
            audience.customer_file_source ?? null,
          segment_key: audience.segment,
          source_status: audience.provenance,
          metadata: {
            lookalikeSpec: audience.lookalike_spec ?? null,
            sourceFiles: audience.sourceFiles ?? [],
            seedSourceFiles: audience.seedSourceFiles ?? [],
            labelOrigin: audience.labelOrigin,
            usage: audience.usage,
            deliveryStatus: audience.delivery_status ?? null,
            operationStatus: audience.operation_status ?? null,
            estimatedLowerBound:
              audience.approximate_count_lower_bound ?? null,
            estimatedUpperBound:
              audience.approximate_count_upper_bound ?? null
          }
        }))
      )
    if (audiences.error)
      throw new Error(
        `Audience insert failed: ${audiences.error.code}`
      )
    const [segmentReadback, audienceReadback] =
      await Promise.all([
        db
          .from('meta_audience_segment_snapshots')
          .select('segment_key', { count: 'exact', head: true })
          .eq('run_id', report.runId),
        db
          .from('meta_audience_snapshots')
          .select('audience_id', { count: 'exact', head: true })
          .eq('run_id', report.runId)
      ])
    if (
      segmentReadback.error ||
      audienceReadback.error ||
      segmentReadback.count !== report.segments.length ||
      audienceReadback.count !== report.audiences.length
    )
      throw new Error(
        'Registry readback count mismatch; not marked complete'
      )
    const completed = await db
      .from('meta_audience_registry_runs')
      .update({ status: 'complete' })
      .eq('run_id', report.runId)
      .eq('status', 'building')
      .select('run_id,status')
      .single()
    if (completed.error || completed.data?.status !== 'complete')
      throw new Error('Registry completion readback failed')
    return {
      runId: report.runId,
      status: 'complete',
      segments: segmentReadback.count,
      audiences: audienceReadback.count,
      processingVerified: false,
      deliveryVerified: false
    }
  } catch (error) {
    await db
      .from('meta_audience_registry_runs')
      .update({ status: 'failed' })
      .eq('run_id', report.runId)
      .eq('status', 'building')
    throw error
  }
}
