export function projectCanonicalContext(
  args,
  manifest,
  manifestSha,
  deploymentSha
) {
  if (args.name && args.query)
    throw new Error('CONTEXT_AMBIGUOUS_INPUT')
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
          lineage: event.parameter_lineage,
          runtime_contract: event.runtime_contract
        })
          .toLocaleLowerCase('en')
          .includes(query)
      )
    : []
  if (args.name && !matches.length)
    throw new Error('EVENT_NOT_FOUND')
  return {
    result_version: 'canonical-event-context.v2',
    manifest_version: manifest.manifest_version,
    manifest_sha256: manifestSha,
    deployment_sha: deploymentSha,
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
    live_evidence: 'not_queried'
  }
}
