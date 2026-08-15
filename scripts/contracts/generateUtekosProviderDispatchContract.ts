import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CANONICAL_PROVIDER_DISPATCH_RETENTION_SECONDS,
  CANONICAL_PROVIDER_DISPATCH_TOPIC
} from '../../src/lib/analytics/server/canonicalProviderDispatchQueue'
import { providerAdapterRegistry } from '../../src/lib/analytics/server/providerAdapterRegistry'

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const version = '0.1.0'
const outputPath = resolve(
  repositoryRoot,
  'contracts/asyncapi/utekos-provider-dispatch/0.1.0/asyncapi.json'
)
const reportPath = resolve(
  repositoryRoot,
  'contracts/reports/utekos-provider-dispatch-0.1.0-implementation-matrix.md'
)

function buildContract() {
  const adapterKeys = Object.keys(providerAdapterRegistry).sort()

  return {
    'asyncapi': '3.1.0',
    'info': {
      title: 'Utekos Provider Dispatch',
      version,
      description:
        'Characterization contract for the PII-free Vercel Queue envelope that targets one persisted provider outbox attempt. Provider payloads are loaded from the canonical ledger after the message is claimed; they are never placed on this queue.'
    },
    'defaultContentType': 'application/json',
    'servers': {
      vercelQueueRuntime: {
        'host': '{region}.vercel-queue.com',
        'protocol': 'https',
        'description':
          'Vercel-managed Queue Service endpoint. The SDK resolves the runtime region; the deployed application is pinned to arn1.',
        'variables': {
          region: {
            default: 'arn1',
            description:
              'Vercel Queue storage region resolved by @vercel/queue.'
          }
        },
        'x-utekos-runtime': {
          package: '@vercel/queue',
          version: '0.4.0',
          triggerType: 'queue/v2beta'
        }
      }
    },
    'channels': {
      canonicalProviderDispatch: {
        'address': CANONICAL_PROVIDER_DISPATCH_TOPIC,
        'description':
          'One message targets one already-persisted provider dispatch attempt.',
        'servers': [{ $ref: '#/servers/vercelQueueRuntime' }],
        'messages': {
          canonicalProviderDispatchV1: {
            $ref: '#/components/messages/CanonicalProviderDispatchV1'
          }
        },
        'x-utekos-queue-options': {
          retentionSeconds:
            CANONICAL_PROVIDER_DISPATCH_RETENTION_SECONDS,
          visibilityTimeoutSeconds: 60,
          initialDelaySeconds: 0,
          retryAfterSeconds: 15,
          deliveryGuarantee: 'at-least-once',
          acknowledgement:
            'automatic after the consumer callback resolves',
          redelivery:
            'automatic when the callback throws or the visibility lease expires',
          idempotencyKey: 'adapter_key + ":" + attempt_id',
          deduplicationWindowSeconds: 86400
        }
      }
    },
    'operations': {
      publishProviderDispatchAttempt: {
        'action': 'send',
        'channel': {
          $ref: '#/channels/canonicalProviderDispatch'
        },
        'summary':
          'Publish newly persisted provider dispatch attempts.',
        'messages': [
          {
            $ref: '#/channels/canonicalProviderDispatch/messages/canonicalProviderDispatchV1'
          }
        ],
        'x-utekos-implementation':
          'src/lib/analytics/server/canonicalProviderDispatchQueue.ts'
      },
      consumeProviderDispatchAttempt: {
        'action': 'receive',
        'channel': {
          $ref: '#/channels/canonicalProviderDispatch'
        },
        'summary':
          'Validate the envelope, claim the named outbox attempt, and run only its registered provider worker.',
        'messages': [
          {
            $ref: '#/channels/canonicalProviderDispatch/messages/canonicalProviderDispatchV1'
          }
        ],
        'x-utekos-implementation':
          'src/app/api/queues/canonical-provider-dispatch/route.ts',
        'x-utekos-processing-outcomes': [
          'invalid_message',
          'not_claimed',
          'accepted_unverified',
          'retry_scheduled',
          'dead_lettered'
        ]
      }
    },
    'components': {
      messages: {
        CanonicalProviderDispatchV1: {
          name: 'CanonicalProviderDispatchV1',
          title: 'Canonical provider dispatch attempt',
          summary:
            'PII-free pointer to one registered provider outbox attempt.',
          contentType: 'application/json',
          correlationId: {
            description:
              'The persisted provider dispatch attempt UUID.',
            location: '$message.payload#/attempt_id'
          },
          payload: {
            $ref: '#/components/schemas/CanonicalProviderDispatchMessage'
          },
          examples: [
            {
              name: 'metaViewCart',
              payload: {
                adapter_key: 'meta:view_cart',
                attempt_id:
                  '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
                schema_version: 1
              }
            }
          ]
        }
      },
      schemas: {
        CanonicalProviderDispatchMessage: {
          type: 'object',
          additionalProperties: false,
          properties: {
            adapter_key: {
              type: 'string',
              enum: adapterKeys,
              description:
                'Exact key in providerAdapterRegistry and providerOutboxWorkerRegistry.'
            },
            attempt_id: {
              type: 'string',
              format: 'uuid',
              description:
                'Primary key of ops.provider_dispatch_attempts.'
            },
            schema_version: { type: 'integer', const: 1 }
          },
          required: [
            'adapter_key',
            'attempt_id',
            'schema_version'
          ]
        }
      }
    },
    'x-utekos-characterized-against':
      '97a0a4538f9682a2b210e50b770ce59f826b42ac',
    'x-utekos-binding-note':
      'No protocol binding is declared because the official AsyncAPI bindings catalog has no Vercel Queue binding. Kafka, AMQP, and IBM MQ bindings would be false representations.',
    'x-utekos-delivery-note':
      'Vercel Queue delivery is at least once. The publisher idempotency key is deduplicated for min(retention, 24 hours), so consumers and the persisted outbox claim remain the durable idempotency boundary.'
  }
}

function buildReport(
  contract: ReturnType<typeof buildContract>
) {
  const adapterKeys =
    contract.components.schemas.CanonicalProviderDispatchMessage
      .properties.adapter_key.enum
  const rows = adapterKeys.map(key => {
    const [provider, eventName] = key.split(':')
    return `| \`${key}\` | \`${provider}\` | \`${eventName}\` | registered adapter + worker |`
  })

  return `# Utekos Provider Dispatch 0.1.0 implementation matrix

Characterized queue topic: \`${CANONICAL_PROVIDER_DISPATCH_TOPIC}\`.

The queue message contains only \`adapter_key\`, \`attempt_id\`, and \`schema_version\`. Canonical events, user identifiers, provider tokens, provider payloads, and provider responses remain in the persisted ledger/outbox boundary and are not queue fields.

| Adapter key | Provider | Canonical event | Runtime status |
| --- | --- | --- | --- |
${rows.join('\n')}

## Runtime invariants

- Publisher idempotency key: \`adapter_key + ":" + attempt_id\`.
- Publisher deduplication window: 86,400 seconds (the documented minimum of the seven-day retention and Vercel Queue's 24-hour maximum deduplication window).
- Queue retention: ${CANONICAL_PROVIDER_DISPATCH_RETENTION_SECONDS} seconds (7 days).
- Consumer visibility timeout: 60 seconds.
- Trigger initial delay: 0 seconds.
- Retry delay after a failed callback: 15 seconds.
- Delivery guarantee: at least once. The persisted outbox claim remains the durable idempotency boundary.
- Unknown adapters, non-UUID attempt IDs, and additional fields are rejected by the strict Zod schema.
- Duplicate queue publication is treated as already published. The characterization test loads \`DuplicateMessageError\` through the same package export condition as the implementation so it verifies the runtime class identity rather than mixing the package's ESM and CommonJS builds.
- A post-commit queue publication error is captured but not rethrown; the persisted outbox remains recoverable by the cron fallback.
- Consumer outcomes are internal processing results, not a reply channel or proof of provider acceptance.

## Documentation and test boundary

- Contract syntax: official AsyncAPI 3.1.0 specification.
- Protocol bindings: official AsyncAPI bindings catalog; no Vercel Queue binding is declared.
- Queue semantics and limits: official Vercel Queues documentation plus the installed \`@vercel/queue@0.4.0\` package types and README.
- Deployment trigger: repository \`vercel.json\` and the queue route's \`handleCallback\` options.
- Executable characterization: \`pnpm contracts:dispatch:test\` covers generation drift, schema parity, trigger parity, publishing, duplicate suppression, strict validation, consumer acknowledgement/redelivery behavior, and targeted worker dispatch.
- No ReadyAPI execution result is claimed. The queue callback is invoked by Vercel's managed, signed delivery plane; the available environment does not contain ReadyAPI Desktop or its runner.
`
}

function writeOrCheck(
  path: string,
  content: string,
  check: boolean
) {
  if (check) {
    if (readFileSync(path, 'utf8') !== content) {
      throw new Error(`Generated contract drift: ${path}`)
    }
    return
  }

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

export function generateUtekosProviderDispatchContract(
  check = false
) {
  const contract = buildContract()
  writeOrCheck(
    outputPath,
    `${JSON.stringify(contract, null, 2)}\n`,
    check
  )
  writeOrCheck(reportPath, buildReport(contract), check)
}

const isDirectExecution =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  generateUtekosProviderDispatchContract(
    process.argv.includes('--check')
  )
}
