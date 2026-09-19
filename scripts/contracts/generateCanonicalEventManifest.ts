import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { canonicalEventSchema } from '../../src/lib/analytics/canonicalEvent'
import { eventCatalog } from '../../src/lib/analytics/eventCatalog'
import { utekosEventsContractCatalog } from './utekosEventsContractCatalog'
import { buildUtekosEventDeliveryParameterContract } from './utekosEventDeliveryParameterCatalog'

type JsonObject = Record<string, unknown>

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const manifestVersion = 'canonical-event-manifest.v1'
const operatorPolicyVersion = 'operator-policy-v1'
const selectedEventNames = [
  'add_to_cart',
  'begin_checkout',
  'purchase'
] as const
const evidenceStatusSchema = z.enum([
  'static_verified',
  'runtime_observed',
  'provider_accepted',
  'provider_reported',
  'not_queried'
])

export const canonicalEventManifestSchema = z.strictObject({
  manifest_version: z.literal(manifestVersion),
  source_of_truth: z.strictObject({
    statement: z.string().min(1),
    normative_sources: z.array(z.string().min(1)).min(1)
  }),
  tracking_authorization: z.strictObject({
    mode: z.literal('operator_policy'),
    version: z.literal(operatorPolicyVersion),
    authorization: z.strictObject({
      analytics: z.literal('granted'),
      marketing: z.literal('granted'),
      preferences: z.literal('granted')
    }),
    cookiebot_state: z.literal(
      'not_used_for_tracking_authorization'
    )
  }),
  evidence_statuses: z.array(evidenceStatusSchema).min(1),
  generated_from: z.strictObject({
    source_files: z
      .array(
        z.strictObject({
          path: z.string().min(1),
          sha256: z.string().regex(/^[a-f0-9]{64}$/)
        })
      )
      .min(1)
  }),
  events: z
    .array(
      z.strictObject({
        name: z.enum(selectedEventNames),
        membership: z.literal('canonical'),
        schema: z.strictObject({
          source: z.string().min(1),
          json_schema: z.record(z.string(), z.unknown())
        }),
        contract: z.strictObject({
          route: z.string().min(1).nullable(),
          source_files: z.array(z.string().min(1)).min(1)
        }),
        policy: z.record(z.string(), z.unknown()),
        provider_mappings: z.record(z.string(), z.unknown()),
        parameter_lineage: z.array(
          z.strictObject({
            provider: z.string().min(1),
            delivery: z.enum(['browser', 'server']),
            target_parameter: z.string().min(1),
            source: z.string().min(1),
            requirement: z.enum([
              'required',
              'conditional',
              'recommended',
              'optional'
            ]),
            rule: z.string().min(1)
          })
        ),
        evidence: z.strictObject({
          static: z.literal('static_verified'),
          runtime: z.literal('not_queried'),
          provider_accepted: z.literal('not_queried'),
          provider_reported: z.literal('not_queried')
        })
      })
    )
    .length(selectedEventNames.length)
})

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

const sourceFiles = [
  'src/lib/analytics/addToCartEvent.ts',
  'src/lib/analytics/beginCheckoutEvent.ts',
  'src/lib/analytics/purchaseEvent.ts',
  'src/lib/analytics/canonicalEvent.ts',
  'src/lib/analytics/canonicalEventEnvelope.ts',
  'src/lib/analytics/eventCatalog.ts',
  'src/lib/consent/resolveTrackingAuthorization.ts',
  'scripts/contracts/utekosEventsContractCatalog.ts',
  'scripts/contracts/utekosEventDeliveryParameterCatalog.ts'
] as const

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
  >
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
          lines.push({
            provider,
            delivery,
            target_parameter: parameter.path,
            source: parameter.source,
            requirement: parameter.requirement,
            rule: parameter.rule
          })
        }
      }
    }
  }

  return lines.toSorted((left, right) =>
    `${left.provider}:${left.delivery}:${left.target_parameter}`.localeCompare(
      `${right.provider}:${right.delivery}:${right.target_parameter}`
    )
  )
}

function camelEventFile(name: string) {
  return `src/lib/analytics/${name.replace(/_([a-z])/gu, (_, letter: string) => letter.toUpperCase())}Event.ts`
}

function canonicalSchemaByEventName() {
  const schemas = new Map<string, z.core.$ZodType>()
  for (const schema of canonicalEventSchema.options) {
    const eventName = schema.shape.event_name._zod.def.values[0]
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

function buildManifest() {
  const deliveryContract =
    buildUtekosEventDeliveryParameterContract()
  const contractByEvent = new Map(
    utekosEventsContractCatalog.map(contract => [
      contract.eventName,
      contract
    ])
  )
  const schemasByEvent = canonicalSchemaByEventName()

  const events = selectedEventNames.map(name => {
    const contract = contractByEvent.get(name)
    const policy = eventCatalog[name]
    const delivery = deliveryContract.events[name]
    const schema = schemasByEvent.get(name)
    if (!policy || !delivery || !schema) {
      throw new Error(`Missing normative source for ${name}`)
    }
    const schemaFile =
      contract?.schemaFile ?? camelEventFile(name)

    return {
      name,
      membership: 'canonical' as const,
      schema: {
        source: schemaFile,
        json_schema: z.toJSONSchema(schema, {
          target: 'draft-2020-12',
          unrepresentable: 'throw'
        }) as JsonObject
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
      parameter_lineage: parameterLineage(
        name,
        deliveryContract
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
    source_of_truth: {
      statement:
        'Manifestet er den offisielle Control Plane-outputen, men normative TypeScript/Zod-schemas, contracts og eksplisitte provider mappings forblir source of truth som manifestet genereres fra.',
      normative_sources: [
        'src/lib/analytics/*Event.ts',
        'src/lib/analytics/canonicalEventEnvelope.ts',
        'src/lib/analytics/eventCatalog.ts',
        'src/lib/consent/resolveTrackingAuthorization.ts',
        'scripts/contracts/utekosEventsContractCatalog.ts',
        'scripts/contracts/utekosEventDeliveryParameterCatalog.ts'
      ]
    },
    tracking_authorization: {
      mode: 'operator_policy',
      version: operatorPolicyVersion,
      authorization: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'granted'
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
      source_files: sourceFiles.map(sourceDigest)
    },
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
  const manifest = buildManifest()
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
}

const isDirectExecution =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  generateCanonicalEventManifest(
    process.argv.includes('--check')
  )
}
