import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { canonicalEventSchema } from '../../src/lib/analytics/canonicalEvent'
import { eventCatalog } from '../../src/lib/analytics/eventCatalog'
import { utekosEventsContractCatalog } from './utekosEventsContractCatalog'
import { buildUtekosEventDeliveryParameterContract } from './utekosEventDeliveryParameterCatalog'
import { readCanonicalManifestSources } from './readCanonicalManifestSources'
import { OPERATOR_TRACKING_AUTHORIZATION } from '../../src/lib/consent/resolveTrackingAuthorization'
import { readCanonicalPipeline } from './readCanonicalPipeline'
import { canonicalEventManifestSchema } from '../../src/lib/canonical-control/controlManifest'
import { controlResultSchema } from '../../src/lib/canonical-control/controlResult'
import { readCanonicalPilotRules } from './readCanonicalPilotRules'

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const manifestVersion = 'canonical-event-manifest.v1'
const operatorPolicyVersion = 'operator-policy-v1'
const selectedEventNames = canonicalEventSchema.options.map(
  schema => {
    const name =
      schema._zod.def.shape.event_name._zod.def.values[0]
    if (typeof name !== 'string')
      throw new Error('Invalid canonical event name')
    return name
  }
)
export { canonicalEventManifestSchema } from '../../src/lib/canonical-control/controlManifest'

const generatedPaths = {
  schema: resolve(
    repositoryRoot,
    'contracts/events/canonical-event-manifest/v1/canonical-event-manifest.v1.schema.json'
  ),
  manifest: resolve(
    repositoryRoot,
    'contracts/events/canonical-event-manifest/v1/canonical-event-manifest.v1.json'
  ),
  sha256: resolve(
    repositoryRoot,
    'contracts/events/canonical-event-manifest/v1/canonical-event-manifest.v1.sha256'
  )
} as const

function sha256(value: string | Buffer) {
  return createHash('sha256').update(value).digest('hex')
}

function serialize(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function sourceDigest(path: string) {
  return {
    path,
    sha256: sha256(readFileSync(resolve(repositoryRoot, path)))
  }
}

function parameterLineage(
  eventName: (typeof selectedEventNames)[number],
  deliveryContract: ReturnType<
    typeof buildUtekosEventDeliveryParameterContract
  >,
  runtimeRules: ReturnType<
    typeof readCanonicalPilotRules
  >['events'][string]['rules']
) {
  const event = deliveryContract.events[eventName]
  if (!event) {
    throw new Error(`Unknown canonical event ${eventName}`)
  }
  const lines: Array<
    z.infer<
      typeof canonicalEventManifestSchema
    >['events'][number]['parameter_lineage'][number]
  > = []
  const microsoftCommerceRules = runtimeRules.filter(
    (
      rule
    ): rule is Extract<
      (typeof runtimeRules)[number],
      { kind: 'microsoft_commerce' }
    > => rule.kind === 'microsoft_commerce'
  )

  for (const [provider, mapping] of Object.entries(
    event.providers
  )) {
    for (const delivery of ['browser', 'server'] as const) {
      const declared = mapping[delivery]
      if (declared === null) continue

      for (const setName of declared.parameterContract
        .parameterSets) {
        const parameters =
          setName in deliveryContract.parameterSets ?
            deliveryContract.parameterSets[
              setName as keyof typeof deliveryContract.parameterSets
            ]
          : undefined
        if (!parameters) {
          throw new Error(`Unknown parameter set ${setName}`)
        }
        for (const parameter of parameters) {
          if (
            provider === 'microsoft_uet' &&
            delivery === 'server' &&
            microsoftCommerceRules.some(rule =>
              [
                ...rule.transaction_id_targets,
                rule.item_price_target
              ].some(
                target => parameter.path === `data[].${target}`
              )
            )
          )
            continue
          lines.push({
            provider,
            delivery,
            target_parameter: parameter.path,
            authority: 'catalog_declaration',
            runtime_rule_id: null,
            source: parameter.source,
            requirement: parameter.requirement,
            rule: parameter.rule
          })
        }
      }
    }
  }

  for (const rule of microsoftCommerceRules) {
    const shared = {
      provider: 'microsoft_uet',
      delivery: 'server' as const,
      authority: 'runtime_rule' as const,
      runtime_rule_id: rule.id,
      requirement: 'required' as const
    }
    for (const target of rule.transaction_id_targets) {
      lines.push({
        ...shared,
        target_parameter: `data[].${target}`,
        source: `custom_data.${rule.transaction_id_source}`,
        rule: `Copy the transaction source selected by ${rule.id}.`
      })
    }
    lines.push({
      ...shared,
      target_parameter: `data[].${rule.item_price_target}`,
      source: rule.item_price_sources
        .map(source => `custom_data.items[].${source}`)
        .join(' ?? '),
      rule: `${rule.selection}; rule ${rule.id}.`
    })
  }

  return lines.toSorted((left, right) =>
    `${left.provider}:${left.delivery}:${left.target_parameter}`.localeCompare(
      `${right.provider}:${right.delivery}:${right.target_parameter}`
    )
  )
}

function canonicalSchemaByEventName() {
  const schemas = new Map<string, z.core.$ZodType>()
  for (const schema of canonicalEventSchema.options) {
    const eventName =
      schema._zod.def.shape.event_name._zod.def.values[0]
    if (
      typeof eventName !== 'string' ||
      schemas.has(eventName)
    ) {
      throw new Error('Invalid canonical event union')
    }
    schemas.set(eventName, schema)
  }
  return schemas
}

export function buildCanonicalEventManifest() {
  const sources = readCanonicalManifestSources(repositoryRoot)
  const pipeline = readCanonicalPipeline(repositoryRoot)
  const pilotRules = readCanonicalPilotRules(repositoryRoot)
  if (sources.schemaFiles.length !== selectedEventNames.length)
    throw new Error('Canonical source membership mismatch')
  const deliveryContract =
    buildUtekosEventDeliveryParameterContract()
  const contractByEvent = new Map(
    utekosEventsContractCatalog.map(contract => [
      contract.eventName,
      contract
    ])
  )
  const schemasByEvent = canonicalSchemaByEventName()

  const events = selectedEventNames.map((name, index) => {
    const contract = contractByEvent.get(name)
    const policy = eventCatalog[name]
    const delivery = deliveryContract.events[name]
    const schema = schemasByEvent.get(name)
    if (!policy || !delivery || !schema) {
      throw new Error(`Missing normative source for ${name}`)
    }
    const schemaFile = sources.schemaFiles[index]
    if (!schemaFile)
      throw new Error(`Missing schema source for ${name}`)

    return {
      name,
      membership: 'canonical' as const,
      schema: {
        source: schemaFile,
        json_schema: z.toJSONSchema(schema, {
          target: 'draft-2020-12',
          unrepresentable: 'throw'
        })
      },
      contract: {
        route:
          contract ?
            `/api/events/${contract.routeSegment}`
          : null,
        source_files:
          contract ?
            [
              contract.schemaFile,
              contract.normalizerFile,
              contract.acceptFile,
              contract.requestHandlerFile,
              contract.routeHandlerFile
            ]
          : [schemaFile]
      },
      policy: structuredClone(policy),
      provider_mappings: structuredClone(delivery.providers),
      runtime_contract: {
        coverage:
          name in pilotRules.events ?
            'pilot_event_runtime_and_provider_connections'
          : 'not_migrated',
        rules: pilotRules.events[name]?.rules ?? [],
        connections: pilotRules.events[name]?.connections ?? [],
        remaining_metadata:
          'catalog_declarations_not_runtime_verified'
      },
      parameter_lineage: parameterLineage(
        name,
        deliveryContract,
        pilotRules.events[name]?.rules ?? []
      ),
      evidence: {
        static: 'static_verified' as const,
        runtime: 'not_queried' as const,
        provider_accepted: 'not_queried' as const,
        provider_reported: 'not_queried' as const
      }
    }
  })

  return canonicalEventManifestSchema.parse({
    manifest_version: manifestVersion,
    agent_contract: {
      path: 'contracts/events/canonical-event-manifest/v1/canonical-event-context.v2.schema.json',
      sha256: sha256(
        serialize(
          z.toJSONSchema(controlResultSchema, {
            target: 'draft-2020-12',
            unrepresentable: 'throw'
          })
        )
      )
    },
    source_of_truth: {
      statement:
        'Manifestet er den offisielle Control Plane-outputen, men normative TypeScript/Zod-schemas, contracts og eksplisitte provider mappings forblir source of truth som manifestet genereres fra.',
      normative_sources: [
        'src/lib/analytics/*Event.ts',
        'src/lib/analytics/canonicalEventEnvelope.ts',
        'src/lib/analytics/eventCatalog.ts',
        'src/lib/analytics/googleCommerceEventMapping.ts',
        'src/lib/analytics/metaCommerceEventMapping.ts',
        'src/lib/analytics/microsoftCommerceRules.ts',
        'src/lib/analytics/pinterestEventMapping.ts',
        'src/lib/analytics/snapchatEventMapping.ts',
        'src/lib/consent/resolveTrackingAuthorization.ts',
        'scripts/contracts/utekosEventsContractCatalog.ts',
        'scripts/contracts/utekosEventDeliveryParameterCatalog.ts'
      ]
    },
    tracking_authorization: {
      mode: 'operator_policy',
      version: operatorPolicyVersion,
      authorization: {
        analytics: OPERATOR_TRACKING_AUTHORIZATION.analytics,
        marketing: OPERATOR_TRACKING_AUTHORIZATION.marketing,
        preferences: OPERATOR_TRACKING_AUTHORIZATION.preferences
      },
      cookiebot_state: 'not_used_for_tracking_authorization'
    },
    evidence_statuses: [
      'static_verified',
      'runtime_observed',
      'provider_accepted',
      'provider_reported',
      'not_queried'
    ],
    generated_from: {
      source_files: [
        ...new Set([
          ...sources.sourceFiles,
          ...pipeline.sourceFiles,
          ...pilotRules.sourceFiles,
          ...events.flatMap(event => event.contract.source_files)
        ])
      ]
        .sort()
        .map(sourceDigest)
    },
    catalog_only: Object.entries(eventCatalog)
      .filter(([name]) => !schemasByEvent.has(name))
      .map(([name, policy]) => ({
        name,
        membership: 'catalog_only',
        policy
      })),
    limitations: [
      'JSON Schema describes structural validation; custom Zod refinements remain authoritative in the referenced source.',
      'Catalog consent requirements are declarations. The current web tracking authorization is operator_policy; Cookiebot state is not consulted.',
      'Provider mappings and lifecycle labels are source declarations, not deployment, delivery, reporting or attribution evidence.',
      'For add_to_cart and purchase, runtime_contract records source-verified collection, persistence, dispatch registry, adapter, mapper and sender bindings. This is a static code graph, not runtime, deployment or provider evidence.',
      'Only the Microsoft commerce parameter lineage is migrated to executable ownership. Other parameter descriptions remain unverified catalog declarations. Mapper guards may still inspect the supplied event snapshot; operator_policy does not prove their absence.'
    ],
    pipeline: pipeline.definition,
    events
  })
}

function writeOrCheck(
  path: string,
  content: string,
  check: boolean
) {
  if (check) {
    if (readFileSync(path, 'utf8') !== content) {
      throw new Error(
        `Generated canonical manifest drift: ${path}`
      )
    }
    return
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

export function generateCanonicalEventManifest(check = false) {
  const manifest = buildCanonicalEventManifest()
  const manifestContent = serialize(manifest)
  const schemaContent = serialize(
    z.toJSONSchema(canonicalEventManifestSchema, {
      target: 'draft-2020-12',
      unrepresentable: 'throw'
    })
  )
  const checksumContent = `${sha256(manifestContent)}  canonical-event-manifest.v1.json\n`

  writeOrCheck(generatedPaths.schema, schemaContent, check)
  writeOrCheck(generatedPaths.manifest, manifestContent, check)
  writeOrCheck(generatedPaths.sha256, checksumContent, check)
  writeOrCheck(
    resolve(
      repositoryRoot,
      'contracts/events/canonical-event-manifest/v1/canonical-event-context.v2.schema.json'
    ),
    serialize(
      z.toJSONSchema(controlResultSchema, {
        target: 'draft-2020-12',
        unrepresentable: 'throw'
      })
    ),
    check
  )
}

const isDirectExecution =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  generateCanonicalEventManifest(
    process.argv.includes('--check')
  )
}
