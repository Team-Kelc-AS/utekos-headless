import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import {
  canonicalCommerceItemSchema,
  canonicalCommerceValueSchema
} from '../../src/lib/analytics/canonicalCommerceItem'
import { canonicalEventEnvelopeSchema } from '../../src/lib/analytics/canonicalEventEnvelope'
import {
  canonicalClickIdsSchema,
  canonicalSignalAuditSchema
} from '../../src/lib/analytics/canonicalSignalContract'
import { utekosEventsContractCatalog } from './utekosEventsContractCatalog'
import { buildUtekosEventDeliveryParameterContract } from './utekosEventDeliveryParameterCatalog'

type JsonObject = Record<string, unknown>

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const version = '0.1.0'
const characterizedCommit =
  '97a0a4538f9682a2b210e50b770ce59f826b42ac'
const domainRelativeRef =
  '../../../domains/utekos-common/0.1.0/domain.json'
const swaggerHubDomainRef =
  'https://api.swaggerhub.com/domains/kelc/UtekosCommon/0.1.0'
const commonEnvelopeProperties = [
  'browser_id',
  'click_id',
  'client_ip_address',
  'consent',
  'environment',
  'event_device_info',
  'event_id',
  'event_time',
  'external_id',
  'impression_id',
  'location',
  'page_url',
  'region_code',
  'schema_version',
  'signal_audit',
  'user_data'
] as const
const commonEnvelopePropertyComponents = {
  browser_id: 'BrowserId',
  click_id: 'ClickId',
  client_ip_address: 'ClientIpAddress',
  consent: 'ConsentSnapshot',
  environment: 'EventEnvironment',
  event_device_info: 'EventDeviceInfo',
  event_id: 'EventId',
  event_time: 'EventTime',
  external_id: 'ExternalId',
  impression_id: 'ImpressionId',
  location: 'EventLocation',
  page_url: 'PageUrl',
  region_code: 'RegionCode',
  schema_version: 'SchemaVersion',
  signal_audit: 'SignalAudit',
  user_data: 'UserData'
} as const

const generatedPaths = {
  domain: resolve(
    repositoryRoot,
    'contracts/domains/utekos-common/0.1.0/domain.json'
  ),
  openapi: resolve(
    repositoryRoot,
    'contracts/openapi/utekos-events/0.1.0/openapi.json'
  ),
  resolvedOpenapi: resolve(
    repositoryRoot,
    'contracts/openapi/utekos-events/0.1.0/openapi.resolved.json'
  ),
  swaggerHubOpenapi: resolve(
    repositoryRoot,
    'contracts/openapi/utekos-events/0.1.0/openapi.swaggerhub.json'
  ),
  readyApiCases: resolve(
    repositoryRoot,
    'contracts/readyapi/utekos-events/characterization-cases.json'
  ),
  inventory: resolve(
    repositoryRoot,
    'contracts/reports/utekos-events-0.1.0-implementation-matrix.md'
  ),
  deliveryParameters: resolve(
    repositoryRoot,
    'contracts/events/utekos-event-delivery/0.1.0/parameter-contract.json'
  ),
  deliveryParameterReport: resolve(
    repositoryRoot,
    'contracts/reports/utekos-event-delivery-parameter-matrix.md'
  )
} as const

function toOpenApiSchema(schema: z.ZodType): JsonObject {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    unrepresentable: 'throw'
  }) as JsonObject
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function getObjectProperty(
  object: JsonObject,
  property: string
): JsonObject {
  const value = object[property]
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new Error(`Expected object property ${property}`)
  }

  return value as JsonObject
}

function domainComponentRef(section: string, name: string) {
  return {
    $ref: `${domainRelativeRef}#/components/${section}/${name}`
  }
}

function buildDomain() {
  const envelope = toOpenApiSchema(canonicalEventEnvelopeSchema)
  const envelopeProperties = getObjectProperty(
    envelope,
    'properties'
  )
  const commonEnvelopeSchemas = Object.fromEntries(
    Object.entries(commonEnvelopePropertyComponents).map(
      ([property, component]) => [
        component,
        clone(getObjectProperty(envelopeProperties, property))
      ]
    )
  )
  const domain = {
    'openapi': '3.0.3',
    'info': {
      title: 'UtekosCommon',
      version,
      description:
        'Reusable schemas, parameters, headers, and responses shared by Utekos HTTP API contracts. Runtime Zod schemas remain authoritative for accepted event payloads.'
    },
    'x-utekos-contract-kind': 'swaggerhub-domain',
    'x-utekos-characterized-against': characterizedCommit,
    'components': {
      schemas: {
        CanonicalEventEnvelope: {
          ...envelope,
          description:
            'Common envelope accepted by canonical event schemas before request-context normalization.'
        },
        ...commonEnvelopeSchemas,
        CanonicalClickIds: toOpenApiSchema(
          canonicalClickIdsSchema
        ),
        IdentifierMap: clone(
          getObjectProperty(envelopeProperties, 'browser_id')
        ),
        CanonicalSignalAudit: toOpenApiSchema(
          canonicalSignalAuditSchema
        ),
        CanonicalCommerceItem: toOpenApiSchema(
          canonicalCommerceItemSchema
        ),
        CanonicalCommerceValue: toOpenApiSchema(
          canonicalCommerceValueSchema
        ),
        EventReceipt: {
          type: 'object',
          additionalProperties: false,
          properties: {
            event_id: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['accepted', 'duplicate']
            }
          },
          required: ['event_id', 'status']
        },
        ErrorResponse: {
          type: 'object',
          additionalProperties: false,
          properties: {
            error: {
              type: 'string',
              enum: [
                'forbidden_origin',
                'unsupported_media_type',
                'payload_too_large',
                'invalid_json',
                'invalid_event',
                'internal_error'
              ]
            }
          },
          required: ['error']
        }
      },
      parameters: {
        OriginHeader: {
          name: 'Origin',
          in: 'header',
          required: true,
          description:
            'Must parse to the same origin as the requested endpoint. Missing, malformed, or cross-origin values receive 403.',
          schema: { type: 'string', format: 'uri' },
          example: 'https://utekos.no'
        },
        CheckoutMethodHeader: {
          name: 'X-Utekos-Checkout-Method',
          in: 'header',
          required: false,
          description:
            'Authoritative checkout method for begin_checkout. Missing or invalid values currently normalize to shopify_checkout.',
          schema: {
            type: 'string',
            enum: ['shopify_checkout', 'klarna_express'],
            default: 'shopify_checkout'
          }
        }
      },
      headers: {
        CacheControl: {
          description: 'Collector responses are not cacheable.',
          schema: {
            type: 'string',
            example: 'no-store, max-age=0'
          }
        },
        ContentType: {
          description:
            'JSON response media type when a body is present.',
          schema: {
            type: 'string',
            example: 'application/json; charset=utf-8'
          }
        },
        SetCookie: {
          description:
            'Page-view acceptance can set first-party browser identifier cookies.',
          schema: { type: 'string' }
        },
        TrafficClassification: {
          description:
            'Present on a 204 generated by traffic exclusion before event collection.',
          schema: { type: 'string' }
        }
      },
      responses: {
        EventAccepted: receiptResponse('accepted', 202),
        EventDuplicate: receiptResponse('duplicate', 200),
        EventSuppressed: {
          description:
            'No body. The route either rejected the event because both analytics and marketing consent were denied, or excluded the request from marketing dispatch during traffic classification.',
          headers: {
            'Cache-Control': {
              $ref: '#/components/headers/CacheControl'
            },
            'Content-Type': {
              $ref: '#/components/headers/ContentType'
            },
            'X-Utekos-Traffic-Classification': {
              $ref: '#/components/headers/TrafficClassification'
            }
          }
        },
        InvalidRequest: errorResponse(
          'Malformed JSON or a payload that violates the canonical event schema.',
          ['invalid_json', 'invalid_event']
        ),
        ForbiddenOrigin: errorResponse(
          'The Origin header was missing, malformed, or did not match the request origin.',
          ['forbidden_origin']
        ),
        PayloadTooLarge: errorResponse(
          'The declared or measured UTF-8 request body exceeded 32 KiB.',
          ['payload_too_large']
        ),
        UnsupportedMediaType: errorResponse(
          'The request media type was not application/json.',
          ['unsupported_media_type']
        ),
        InternalError: errorResponse(
          'A non-validation failure occurred while normalizing or storing the event.',
          ['internal_error']
        )
      }
    }
  }

  return domain
}

function receiptResponse(
  status: 'accepted' | 'duplicate',
  code: number
) {
  return {
    'description':
      status === 'accepted' ?
        'The event was accepted for persistence and dispatch planning.'
      : 'The event_id already existed and the event was treated as a duplicate.',
    'headers': {
      'Cache-Control': {
        $ref: '#/components/headers/CacheControl'
      },
      'Content-Type': {
        $ref: '#/components/headers/ContentType'
      }
    },
    'content': {
      'application/json': {
        schema: { $ref: '#/components/schemas/EventReceipt' },
        example: {
          event_id: '11111111-1111-4111-8111-111111111111',
          status
        }
      }
    },
    'x-utekos-status-code': code
  }
}

function errorResponse(
  description: string,
  errors: readonly string[]
) {
  return {
    description,
    headers: {
      'Cache-Control': {
        $ref: '#/components/headers/CacheControl'
      },
      'Content-Type': {
        $ref: '#/components/headers/ContentType'
      }
    },
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        examples: Object.fromEntries(
          errors.map(error => [error, { value: { error } }])
        )
      }
    }
  }
}

function buildEventSchemas() {
  const envelopeProperties = getObjectProperty(
    toOpenApiSchema(canonicalEventEnvelopeSchema),
    'properties'
  )

  return Object.fromEntries(
    utekosEventsContractCatalog.map(event => {
      const parsedExample = event.schema.parse(event.example)
      const generated = toOpenApiSchema(event.schema)
      const generatedProperties = getObjectProperty(
        generated,
        'properties'
      )

      for (const property of commonEnvelopeProperties) {
        const eventProperty = generatedProperties[property]
        const envelopeProperty = envelopeProperties[property]
        if (
          JSON.stringify(eventProperty) !==
          JSON.stringify(envelopeProperty)
        ) {
          throw new Error(
            `${event.eventName}.${property} drifted from canonicalEventEnvelopeSchema`
          )
        }

        generatedProperties[property] = {
          $ref: `${domainRelativeRef}#/components/schemas/CanonicalEventEnvelope/properties/${property}`
        }
      }

      const schema: JsonObject = {
        ...generated,
        'description': `${event.description} Source: ${event.schemaFile}.`,
        'example': parsedExample,
        'x-utekos-implementation-schema': event.schemaFile
      }

      if (event.eventName === 'remove_from_cart') {
        schema['x-utekos-runtime-constraints'] = [
          'When source is web, page_url and page_title are required by canonicalRemoveFromCartSchema.superRefine.'
        ]
      }

      if (event.eventName === 'view_item_list') {
        schema['x-utekos-runtime-constraints'] = [
          'custom_data.total_item_count must be greater than or equal to custom_data.items.length.'
        ]
      }

      return [event.componentName, schema]
    })
  )
}

function buildApi(
  domain: ReturnType<typeof buildDomain>,
  deliveryContract: ReturnType<
    typeof buildUtekosEventDeliveryParameterContract
  >
) {
  const eventSchemas = buildEventSchemas()
  const tags = [
    ['Core', 'Core page lifecycle events.'],
    ['Commerce', 'Commerce intent and cart funnel events.'],
    [
      'Discovery',
      'Search, list, category, filtering, and sorting events.'
    ],
    ['Engagement', 'Content and interaction events.'],
    ['Leads', 'Form and lead lifecycle events.'],
    ['Promotion', 'Promotion impression and selection events.']
  ].map(([name, description]) => ({ name, description }))

  const api = {
    'openapi': '3.0.3',
    'info': {
      title: 'Utekos Events API',
      version,
      description:
        'Characterization contract for the existing Utekos canonical event collectors under /api/events. The implementation and its Zod schemas remain authoritative until a deliberate contract-first migration is approved.',
      contact: {
        name: 'Utekos API Platform',
        url: 'https://utekos.no'
      }
    },
    'externalDocs': {
      description: 'Source repository',
      url: 'https://github.com/Team-Kelc-AS/utekos-headless'
    },
    'servers': [
      { url: 'https://utekos.no', description: 'Production' },
      {
        url: 'http://localhost:3000',
        description: 'Local Next.js development server'
      }
    ],
    tags,
    'x-utekos-contract-role': 'characterization',
    'x-utekos-characterized-against': characterizedCommit,
    'paths': Object.fromEntries(
      utekosEventsContractCatalog.map(event => [
        `/api/events/${event.routeSegment}`,
        {
          post: buildOperation(
            event,
            requireDeliveryEvent(
              deliveryContract,
              event.eventName
            )
          )
        }
      ])
    ),
    'components': {
      schemas: eventSchemas,
      responses: {
        PageViewAccepted: pageViewReceiptResponse('accepted'),
        PageViewDuplicate: pageViewReceiptResponse('duplicate')
      }
    }
  }

  return {
    api,
    resolved: resolveExternalDomainRefs(api, domain),
    swaggerHub: rewriteDomainRefs(api, swaggerHubDomainRef)
  }
}

function requireDeliveryEvent(
  contract: ReturnType<
    typeof buildUtekosEventDeliveryParameterContract
  >,
  eventName: string
) {
  const event = contract.events[eventName]
  if (!event) {
    throw new Error(
      `Missing delivery parameter contract for ${eventName}`
    )
  }

  return event
}

function buildOperation(
  event: (typeof utekosEventsContractCatalog)[number],
  deliveryParameters: ReturnType<
    typeof buildUtekosEventDeliveryParameterContract
  >['events'][string]
) {
  const parameters = [
    domainComponentRef('parameters', 'OriginHeader')
  ]
  if (event.eventName === 'begin_checkout') {
    parameters.push(
      domainComponentRef('parameters', 'CheckoutMethodHeader')
    )
  }

  const isPageView = event.eventName === 'page_view'
  const responses = {
    '200':
      isPageView ?
        { $ref: '#/components/responses/PageViewDuplicate' }
      : domainComponentRef('responses', 'EventDuplicate'),
    '202':
      isPageView ?
        { $ref: '#/components/responses/PageViewAccepted' }
      : domainComponentRef('responses', 'EventAccepted'),
    '204': domainComponentRef('responses', 'EventSuppressed'),
    '400': domainComponentRef('responses', 'InvalidRequest'),
    '403': domainComponentRef('responses', 'ForbiddenOrigin'),
    '413': domainComponentRef('responses', 'PayloadTooLarge'),
    '415': domainComponentRef(
      'responses',
      'UnsupportedMediaType'
    ),
    '500': domainComponentRef('responses', 'InternalError')
  }

  return {
    'operationId': `collect${event.componentName}`,
    'summary': event.summary,
    'description': event.description,
    'tags': [event.tag],
    parameters,
    'requestBody': {
      required: true,
      description:
        'Canonical event JSON. The implementation rejects bodies larger than 32 KiB after UTF-8 encoding.',
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${event.componentName}`
          },
          example: event.schema.parse(event.example)
        }
      }
    },
    responses,
    'x-utekos-max-body-bytes': 32768,
    'x-utekos-implementation': {
      route: `src/app/api/events/${event.routeSegment}/route.ts`,
      routeHandler: event.routeHandlerFile,
      requestHandler: event.requestHandlerFile,
      accept: event.acceptFile,
      normalizer: event.normalizerFile,
      schema: event.schemaFile
    },
    'x-utekos-event-delivery': {
      contract:
        'contracts/events/utekos-event-delivery/0.1.0/parameter-contract.json',
      pointer: `#/events/${event.eventName}`,
      eventName: event.eventName,
      lifecycle: deliveryParameters.lifecycle,
      providers: Object.fromEntries(
        Object.entries(deliveryParameters.providers).map(
          ([provider, mapping]) => [
            provider,
            {
              eventName: mapping.eventName,
              productionStatus: mapping.productionStatus,
              browser:
                mapping.browser === null ?
                  null
                : {
                    transport: mapping.browser.transport,
                    status: mapping.browser.status
                  },
              server:
                mapping.server === null ?
                  null
                : {
                    transport: mapping.server.transport,
                    status: mapping.server.status
                  }
            }
          ]
        )
      )
    }
  }
}

function buildDeliveryParameterReport(
  contract: ReturnType<
    typeof buildUtekosEventDeliveryParameterContract
  >
) {
  const rows = Object.entries(contract.events).flatMap(
    ([eventName, event]) =>
      Object.entries(event.providers).map(
        ([provider, mapping]) => {
          const browser =
            mapping.browser === null ?
              'none'
            : `${mapping.browser.transport} (${mapping.browser.status}; ${mapping.browser.parameterContract.parameterSets.join(' + ') || 'event-specific logical requirements'})`
          const server =
            mapping.server === null ?
              'none'
            : `${mapping.server.transport} (${mapping.server.status}; ${mapping.server.parameterContract.parameterSets.join(' + ') || 'event-specific logical requirements'})`

          return `| \`${eventName}\` | \`${event.lifecycle}\` | \`${provider}\` | ${browser} | ${server} | ${mapping.productionDetail} |`
        }
      )
  )

  return `# Utekos event-delivery parameter matrix

This report is generated from the canonical event catalog and the characterized provider implementations. The complete machine-readable parameter rules are in \`contracts/events/utekos-event-delivery/0.1.0/parameter-contract.json\` and are embedded per operation in Utekos Events API 0.1.0.

## Interpretation

- \`required\`: the provider or repository contract requires the value.
- \`conditional\`: required only for the applicable event, consent, identifier, source, or payload shape.
- \`recommended\`: provider-documented matching or deduplication signal that should be sent when legitimately available.
- \`optional\`: forwarded only when observed and permitted.
- \`blocked_no_worker\` and \`disabled\` are explicit non-delivery states; the contract does not claim that these server payloads are currently sent.

| Canonical event | Lifecycle | Provider | Browser | Server | Current implementation status |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Installed integration owners

${Object.entries(contract.integrations)
  .map(
    ([name, integration]) =>
      `- \`${name}\`: ${integration.package ?? 'repository-owned integration'}${integration.manifestVersion ? ` \`${integration.manifestVersion}\`` : ''}; ${integration.role}; implementation \`${integration.implementation}\`.`
  )
  .join('\n')}

## Official provider sources

${Object.values(contract.documentation)
  .map(source => `- [${source.title}](${source.url})`)
  .join('\n')}
`
}

function pageViewReceiptResponse(
  status: 'accepted' | 'duplicate'
) {
  return {
    description:
      status === 'accepted' ?
        'The page view was accepted. First-party browser identifier cookies may be set.'
      : 'The page-view event_id already existed. First-party browser identifier cookies may be set.',
    headers: {
      'Cache-Control': domainComponentRef(
        'headers',
        'CacheControl'
      ),
      'Content-Type': domainComponentRef(
        'headers',
        'ContentType'
      ),
      'Set-Cookie': domainComponentRef('headers', 'SetCookie')
    },
    content: {
      'application/json': {
        schema: domainComponentRef('schemas', 'EventReceipt'),
        example: {
          event_id: '11111111-1111-4111-8111-111111111111',
          status
        }
      }
    }
  }
}

function resolveExternalDomainRefs<T>(
  value: T,
  domain: ReturnType<typeof buildDomain>
): T {
  const resolved = clone(value) as JsonObject
  const apiComponents = getObjectProperty(resolved, 'components')
  const domainComponents = getObjectProperty(
    domain,
    'components'
  )
  const componentSections = new Set([
    ...Object.keys(domainComponents),
    ...Object.keys(apiComponents)
  ])

  resolved.components = Object.fromEntries(
    [...componentSections].map(section => [
      section,
      {
        ...clone(
          (domainComponents[section] as
            | JsonObject
            | undefined) ?? {}
        ),
        ...clone(
          (apiComponents[section] as JsonObject | undefined) ??
            {}
        )
      }
    ])
  )

  function visit(current: unknown): unknown {
    if (Array.isArray(current)) {
      return current.map(item => visit(item))
    }

    if (!current || typeof current !== 'object') return current

    const record = current as JsonObject
    if (typeof record.$ref === 'string') {
      if (record.$ref.startsWith(`${domainRelativeRef}#/`)) {
        return {
          ...record,
          $ref: `#/${record.$ref.slice(`${domainRelativeRef}#/`.length)}`
        }
      }
    }

    return Object.fromEntries(
      Object.entries(record).map(([key, child]) => [
        key,
        visit(child)
      ])
    )
  }

  return visit(resolved) as T
}

function rewriteDomainRefs<T>(value: T, domainRef: string): T {
  function visit(current: unknown): unknown {
    if (Array.isArray(current)) {
      return current.map(item => visit(item))
    }

    if (!current || typeof current !== 'object') return current

    const record = current as JsonObject
    if (
      typeof record.$ref === 'string' &&
      record.$ref.startsWith(domainRelativeRef)
    ) {
      return {
        ...record,
        $ref: `${domainRef}${record.$ref.slice(domainRelativeRef.length)}`
      }
    }

    return Object.fromEntries(
      Object.entries(record).map(([key, child]) => [
        key,
        visit(child)
      ])
    )
  }

  return visit(value) as T
}

function buildReadyApiCases() {
  return {
    name: 'Utekos Events API characterization plan',
    version,
    openapiImport:
      '../../openapi/utekos-events/0.1.0/openapi.resolved.json',
    characterizedAgainst: characterizedCommit,
    environment: {
      baseUrl: 'http://localhost:3000',
      origin: 'http://localhost:3000'
    },
    limitations: [
      'ReadyAPI Desktop 4.1.0 and SmartBear Functional Testing tools were not available in the implementation environment, so this is a deterministic suite manifest rather than a generated ReadyAPI project XML.',
      'Accepted, duplicate, consent, and traffic-classification cases require a controlled store/classifier or an isolated test environment. They must not be pointed at production as characterization setup.'
    ],
    commonCases: [
      {
        id: 'forbidden-origin',
        safeWithoutStore: true,
        request: {
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://invalid.example'
          },
          body: '{}'
        },
        expect: {
          status: 403,
          json: { error: 'forbidden_origin' },
          cacheControl: 'no-store, max-age=0'
        }
      },
      {
        id: 'unsupported-media-type',
        safeWithoutStore: true,
        request: {
          headers: { 'Content-Type': 'text/plain' },
          body: '{}'
        },
        expect: {
          status: 415,
          json: { error: 'unsupported_media_type' },
          cacheControl: 'no-store, max-age=0'
        }
      },
      {
        id: 'invalid-json',
        safeWithoutStore: true,
        request: {
          headers: { 'Content-Type': 'application/json' },
          body: '{'
        },
        expect: {
          status: 400,
          json: { error: 'invalid_json' },
          cacheControl: 'no-store, max-age=0'
        }
      },
      {
        id: 'declared-body-too-large',
        safeWithoutStore: true,
        request: {
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': '32769'
          },
          body: '{}'
        },
        expect: {
          status: 413,
          json: { error: 'payload_too_large' },
          cacheControl: 'no-store, max-age=0'
        }
      },
      {
        id: 'invalid-event',
        safeWithoutStore: true,
        request: {
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        },
        expect: {
          status: 400,
          json: { error: 'invalid_event' },
          cacheControl: 'no-store, max-age=0'
        }
      }
    ],
    controlledCases: [
      { id: 'accepted', expectStatus: 202 },
      { id: 'duplicate-event-id', expectStatus: 200 },
      { id: 'consent-denied', expectStatus: 204 },
      {
        id: 'traffic-excluded',
        expectStatus: 204,
        expectHeader: 'X-Utekos-Traffic-Classification'
      }
    ],
    operations: utekosEventsContractCatalog.map(event => ({
      operationId: `collect${event.componentName}`,
      method: 'POST',
      path: `/api/events/${event.routeSegment}`,
      validBody: event.schema.parse(event.example),
      implementation: {
        requestHandler: event.requestHandlerFile,
        schema: event.schemaFile
      }
    }))
  }
}

function buildInventory() {
  const rows = utekosEventsContractCatalog.map(event =>
    [
      `/api/events/${event.routeSegment}`,
      event.eventName,
      event.requestHandlerFile,
      event.acceptFile,
      event.normalizerFile,
      event.schemaFile
    ]
      .map(value => `\`${value}\``)
      .join(' | ')
  )

  return `# Utekos Events API 0.1.0 implementation matrix

Characterized against \`${characterizedCommit}\` from \`origin/main\` on 2026-08-15.

All 27 route modules export \`POST\`, set \`maxDuration = 60\`, enrich request context with Vercel geolocation/IP data, and delegate first to \`createBrowserEventRouteHandler\` for traffic classification. The request layer requires a same-origin \`Origin\` header, \`application/json\`, and a UTF-8 body no larger than 32 KiB.

| Route | Canonical event | Request handler | Acceptance handler | Normalizer | Zod schema |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Shared response behavior

| Status | Body | Meaning |
| --- | --- | --- |
| \`202\` | \`{ event_id, status: "accepted" }\` | Inserted by the canonical store. |
| \`200\` | \`{ event_id, status: "duplicate" }\` | Existing \`event_id\`. |
| \`204\` | Empty | Consent denied or traffic excluded before collection. |
| \`400\` | \`{ error: "invalid_json" | "invalid_event" }\` | JSON or Zod validation failure. |
| \`403\` | \`{ error: "forbidden_origin" }\` | Missing, malformed, or cross-origin \`Origin\`. |
| \`413\` | \`{ error: "payload_too_large" }\` | Declared or measured body larger than 32 KiB. |
| \`415\` | \`{ error: "unsupported_media_type" }\` | Media type is not \`application/json\`. |
| \`500\` | \`{ error: "internal_error" }\` | Non-Zod failure during normalization, persistence, or request-side processing. |

## Specialized request handlers

- \`page-view\`: can set first-party cookies and schedules collector-receipt observation.
- \`add-to-cart\`: adds commerce observability logging.
- \`begin-checkout\`: validates the body, then overwrites \`checkout_method\` from \`X-Utekos-Checkout-Method\`; missing or invalid header values normalize to \`shopify_checkout\`.
- \`view-item\`: has a dedicated request handler; its observable HTTP status/body surface matches the shared handler.

## OpenAPI 3.0 representation gaps

- \`canonicalRemoveFromCartSchema.superRefine\` requires \`page_url\` and \`page_title\` only when \`source === "web"\`. The generated schema carries this as \`x-utekos-runtime-constraints\`.
- \`canonicalViewItemListCustomDataSchema.superRefine\` requires \`total_item_count >= items.length\`. The generated schema carries this as \`x-utekos-runtime-constraints\`.
- Automatic Next.js \`OPTIONS\` behavior is framework-owned and is not asserted in the 0.1.0 contract because the verified documentation did not establish the exact response status/body used by this pinned runtime.
`
}

function serialize(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function writeOrCheck(
  path: string,
  content: string,
  check: boolean
) {
  if (check) {
    const existing = readFileSync(path, 'utf8')
    if (existing !== content) {
      throw new Error(`Generated contract drift: ${path}`)
    }
    return
  }

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

export function generateUtekosEventsContracts(check = false) {
  const domain = buildDomain()
  const deliveryContract =
    buildUtekosEventDeliveryParameterContract()
  const { api, resolved, swaggerHub } = buildApi(
    domain,
    deliveryContract
  )

  writeOrCheck(generatedPaths.domain, serialize(domain), check)
  writeOrCheck(generatedPaths.openapi, serialize(api), check)
  writeOrCheck(
    generatedPaths.resolvedOpenapi,
    serialize(resolved),
    check
  )
  writeOrCheck(
    generatedPaths.swaggerHubOpenapi,
    serialize(swaggerHub),
    check
  )
  writeOrCheck(
    generatedPaths.readyApiCases,
    serialize(buildReadyApiCases()),
    check
  )
  writeOrCheck(generatedPaths.inventory, buildInventory(), check)
  writeOrCheck(
    generatedPaths.deliveryParameters,
    serialize(deliveryContract),
    check
  )
  writeOrCheck(
    generatedPaths.deliveryParameterReport,
    buildDeliveryParameterReport(deliveryContract),
    check
  )
}

const isDirectExecution =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  generateUtekosEventsContracts(process.argv.includes('--check'))
}
