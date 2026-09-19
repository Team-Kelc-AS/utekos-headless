import { createHash } from 'node:crypto'
import manifest from '../../../contracts/events/canonical-event-manifest/v1/canonical-event-manifest.v1.json'
import { controlInputSchema } from './controlInput'

export function getCanonicalContext(input: unknown) {
  const args = controlInputSchema.parse(input)
  const query = args.query?.toLocaleLowerCase('en')
  const matches =
    args.name ?
      manifest.events.filter(event => event.name === args.name)
    : query ?
      manifest.events.filter(event =>
        JSON.stringify({
          name: event.name,
          policy: event.policy,
          mappings: event.provider_mappings,
          lineage: event.parameter_lineage
        })
          .toLocaleLowerCase('en')
          .includes(query)
      )
    : []
  if (args.name && !matches.length)
    throw new Error('EVENT_NOT_FOUND')
  return {
    manifest_version: manifest.manifest_version,
    manifest_sha256: createHash('sha256')
      .update(`${JSON.stringify(manifest, null, 2)}\n`)
      .digest('hex'),
    deployment_sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    tracking_authorization: manifest.tracking_authorization,
    inventory: manifest.events.map(event => ({
      name: event.name,
      membership: event.membership
    })),
    catalog_only: manifest.catalog_only.map(event => ({
      name: event.name,
      membership: event.membership
    })),
    contexts: matches
      .slice(0, args.limit)
      .map(event => ({
        definition: event,
        pipeline: {
          evidence: manifest.pipeline.evidence,
          collector: event.contract,
          stages: manifest.pipeline.stages,
          queue_topic: manifest.pipeline.queue_topic,
          adapters: manifest.pipeline.adapters.filter(adapter =>
            adapter.key.endsWith(`:${event.name}`)
          ),
          workers: manifest.pipeline.workers.filter(worker =>
            worker.key.endsWith(`:${event.name}`)
          )
        }
      })),
    total_matches: matches.length,
    truncated: matches.length > args.limit,
    sources: manifest.generated_from.source_files,
    limitations: manifest.limitations,
    live_evidence: 'not_queried' as const
  }
}
