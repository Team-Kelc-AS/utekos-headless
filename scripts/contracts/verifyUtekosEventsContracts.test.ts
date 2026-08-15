import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { createBrowserEventRequestHandler } from '../../src/lib/analytics/server/createBrowserEventRequestHandler'
import { createBrowserEventRouteHandler } from '../../src/lib/analytics/server/createBrowserEventRouteHandler'
import { canonicalEventNames } from '../../src/lib/analytics/eventCatalog'
import { generateUtekosEventsContracts } from './generateUtekosEventsContracts'
import {
  buildUtekosEventDeliveryParameterContract,
  deliveryIntegrations
} from './utekosEventDeliveryParameterCatalog'
import { utekosEventsContractCatalog } from './utekosEventsContractCatalog'

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..'
)

function readJson(path: string) {
  return JSON.parse(
    readFileSync(resolve(repositoryRoot, path), 'utf8')
  )
}

function resolveJsonPointer(
  root: unknown,
  ref: string
): unknown {
  assert.match(ref, /^#\//)

  return ref
    .slice(2)
    .split('/')
    .map(segment =>
      segment.replaceAll('~1', '/').replaceAll('~0', '~')
    )
    .reduce<unknown>((current, segment) => {
      assert.ok(current && typeof current === 'object')
      assert.ok(segment in current)
      return (current as Record<string, unknown>)[segment]
    }, root)
}

test('generated contract artifacts match the current catalog', () => {
  assert.doesNotThrow(() => generateUtekosEventsContracts(true))
})

test('delivery parameter contract covers every canonical event and preserves transport status', () => {
  const contract = buildUtekosEventDeliveryParameterContract()

  assert.deepEqual(
    Object.keys(contract.events).sort(),
    [...canonicalEventNames].sort()
  )
  assert.equal(Object.keys(contract.events).length, 33)

  for (const [eventName, event] of Object.entries(
    contract.events
  )) {
    assert.equal(eventName.length > 0, true)
    for (const mapping of Object.values(event.providers)) {
      if (mapping.browser) {
        assert.equal(
          mapping.browser.parameterContract.parameterSets
            .length > 0 ||
            mapping.browser.parameterContract
              .logicalRequiredParameters.length > 0,
          true
        )
      }
      if (mapping.server) {
        assert.equal(
          mapping.server.parameterContract.parameterSets.length >
            0 ||
            mapping.server.parameterContract
              .logicalRequiredParameters.length > 0,
          true
        )
        if (mapping.server.status === 'blocked_no_worker') {
          assert.notEqual(mapping.server.status, 'active')
        }
      }
    }
  }
})

test('delivery integration versions match installed package manifest', () => {
  const packageManifest = readJson('package.json')
  const dependencies = packageManifest.dependencies as Record<
    string,
    string
  >

  for (const integration of Object.values(
    deliveryIntegrations
  )) {
    if (integration.package === null) continue
    assert.equal(
      dependencies[integration.package],
      integration.manifestVersion,
      integration.package
    )
  }
})

test('every Events API operation embeds its detailed delivery contract', () => {
  const openapi = readJson(
    'contracts/openapi/utekos-events/0.1.0/openapi.resolved.json'
  )

  for (const event of utekosEventsContractCatalog) {
    const delivery =
      openapi.paths[`/api/events/${event.routeSegment}`].post[
        'x-utekos-event-delivery'
      ]
    assert.equal(delivery.eventName, event.eventName)
    assert.equal(
      delivery.contract,
      'contracts/events/utekos-event-delivery/0.1.0/parameter-contract.json'
    )
    assert.deepEqual(Object.keys(delivery.providers).sort(), [
      'google',
      'meta',
      'microsoft_uet',
      'posthog',
      'supabase'
    ])
  }
})

test('catalog covers every src/app/api/events route exactly once', () => {
  const routeRoot = resolve(repositoryRoot, 'src/app/api/events')
  const actualSegments = readdirSync(routeRoot, {
    withFileTypes: true
  })
    .filter(entry => entry.isDirectory())
    .filter(entry =>
      existsSync(resolve(routeRoot, entry.name, 'route.ts'))
    )
    .map(entry => entry.name)
    .sort()
  const catalogSegments = utekosEventsContractCatalog
    .map(event => event.routeSegment)
    .toSorted()

  assert.deepEqual(catalogSegments, actualSegments)
  assert.equal(
    new Set(catalogSegments).size,
    catalogSegments.length
  )
  assert.equal(catalogSegments.length, 27)
})

test('each catalog entry traces to its route, handlers, normalizer, and schema', () => {
  for (const event of utekosEventsContractCatalog) {
    const routePath = `src/app/api/events/${event.routeSegment}/route.ts`
    const routeSource = readFileSync(
      resolve(repositoryRoot, routePath),
      'utf8'
    )

    assert.match(routeSource, /export const maxDuration = 60/)
    assert.match(
      routeSource,
      /export function POST\(request: Request\)/
    )
    assert.match(
      routeSource,
      new RegExp(
        event.requestHandlerFile
          .split('/')
          .at(-1)
          ?.replace('.ts', '') ?? 'unreachable'
      )
    )
    assert.match(
      routeSource,
      new RegExp(
        event.routeHandlerFile
          .split('/')
          .at(-1)
          ?.replace('.ts', '') ?? 'unreachable'
      )
    )

    for (const path of [
      event.acceptFile,
      event.normalizerFile,
      event.requestHandlerFile,
      event.routeHandlerFile,
      event.schemaFile
    ]) {
      assert.equal(
        existsSync(resolve(repositoryRoot, path)),
        true,
        path
      )
    }

    assert.doesNotThrow(() => event.schema.parse(event.example))
  }
})

test('OpenAPI paths and component schemas match the route catalog and Zod schemas', () => {
  const openapi = readJson(
    'contracts/openapi/utekos-events/0.1.0/openapi.resolved.json'
  )

  assert.equal(openapi.openapi, '3.0.3')
  assert.equal(openapi.info.version, '0.1.0')
  assert.deepEqual(
    Object.keys(openapi.paths).sort(),
    utekosEventsContractCatalog
      .map(event => `/api/events/${event.routeSegment}`)
      .toSorted()
  )

  for (const event of utekosEventsContractCatalog) {
    const generated = z.toJSONSchema(event.schema, {
      target: 'openapi-3.0',
      unrepresentable: 'throw'
    }) as Record<string, unknown>
    const component = {
      ...openapi.components.schemas[event.componentName]
    }

    delete component.description
    delete component.example
    delete component['x-utekos-implementation-schema']
    delete component['x-utekos-runtime-constraints']

    component.properties = Object.fromEntries(
      Object.entries(component.properties).map(
        ([property, propertySchema]) => {
          if (
            propertySchema &&
            typeof propertySchema === 'object' &&
            '$ref' in propertySchema &&
            typeof propertySchema.$ref === 'string' &&
            propertySchema.$ref.startsWith(
              '#/components/schemas/'
            )
          ) {
            return [
              property,
              resolveJsonPointer(openapi, propertySchema.$ref)
            ]
          }

          return [property, propertySchema]
        }
      )
    )

    assert.deepEqual(component, generated, event.componentName)
    assert.deepEqual(
      openapi.paths[`/api/events/${event.routeSegment}`].post
        .requestBody.content['application/json'].example,
      event.schema.parse(event.example)
    )
  }
})

test('SwaggerHub artifact references the versioned UtekosCommon Domain', () => {
  const swaggerHub = readFileSync(
    resolve(
      repositoryRoot,
      'contracts/openapi/utekos-events/0.1.0/openapi.swaggerhub.json'
    ),
    'utf8'
  )

  assert.match(
    swaggerHub,
    /https:\/\/api\.swaggerhub\.com\/domains\/kelc\/UtekosCommon\/0\.1\.0#\/components\//
  )
  assert.doesNotMatch(
    swaggerHub,
    /\.\.\/\.\.\/\.\.\/domains\/utekos-common/
  )
})

test('shared request handler characterizes common HTTP outcomes', async () => {
  type Outcome = 'accepted' | 'duplicate' | 'error' | 'rejected'
  let outcome: Outcome = 'accepted'
  const schema = utekosEventsContractCatalog.find(
    event => event.eventName === 'add_to_wishlist'
  )?.schema
  const example = utekosEventsContractCatalog.find(
    event => event.eventName === 'add_to_wishlist'
  )?.example

  assert.ok(schema)
  assert.ok(example)

  const handler = createBrowserEventRequestHandler(
    async ({ payload }) => {
      schema.parse(payload)
      if (outcome === 'error')
        throw new Error('store unavailable')
      if (outcome === 'rejected') {
        return { reason: 'consent_denied', status: 'rejected' }
      }

      return {
        event_id: '11111111-1111-4111-8111-111111111111',
        status: outcome
      }
    }
  )
  const dependencies = {
    getRequestContext: () => ({}),
    store: {
      accept: async () => ({
        createdDispatchAttempts: [],
        status: 'inserted' as const
      })
    }
  }
  const request = (
    body: string,
    headers: Record<string, string> = {
      'Origin': 'https://utekos.no',
      'Content-Type': 'application/json'
    }
  ) =>
    new Request('https://utekos.no/api/events/add-to-wishlist', {
      method: 'POST',
      headers,
      body
    })

  const forbidden = await handler(
    request('{}', {
      'Origin': 'https://invalid.example',
      'Content-Type': 'application/json'
    }),
    dependencies
  )
  assert.equal(forbidden.status, 403)
  assert.deepEqual(await forbidden.json(), {
    error: 'forbidden_origin'
  })

  const unsupported = await handler(
    request('{}', {
      'Origin': 'https://utekos.no',
      'Content-Type': 'text/plain'
    }),
    dependencies
  )
  assert.equal(unsupported.status, 415)

  const oversized = await handler(
    request('{}', {
      'Origin': 'https://utekos.no',
      'Content-Type': 'application/json',
      'Content-Length': '32769'
    }),
    dependencies
  )
  assert.equal(oversized.status, 413)

  const invalidJson = await handler(request('{'), dependencies)
  assert.equal(invalidJson.status, 400)
  assert.deepEqual(await invalidJson.json(), {
    error: 'invalid_json'
  })

  const invalidEvent = await handler(request('{}'), dependencies)
  assert.equal(invalidEvent.status, 400)
  assert.deepEqual(await invalidEvent.json(), {
    error: 'invalid_event'
  })

  outcome = 'accepted'
  const accepted = await handler(
    request(JSON.stringify(example)),
    dependencies
  )
  assert.equal(accepted.status, 202)
  assert.deepEqual(await accepted.json(), {
    event_id: '11111111-1111-4111-8111-111111111111',
    status: 'accepted'
  })

  outcome = 'duplicate'
  const duplicate = await handler(
    request(JSON.stringify(example)),
    dependencies
  )
  assert.equal(duplicate.status, 200)

  outcome = 'rejected'
  const rejected = await handler(
    request(JSON.stringify(example)),
    dependencies
  )
  assert.equal(rejected.status, 204)
  assert.equal(await rejected.text(), '')

  outcome = 'error'
  const failed = await handler(
    request(JSON.stringify(example)),
    dependencies
  )
  assert.equal(failed.status, 500)
  assert.deepEqual(await failed.json(), {
    error: 'internal_error'
  })
})

test('route traffic exclusion returns a classified 204 before collection', async () => {
  let collected = false
  const handler = createBrowserEventRouteHandler()
  const response = await handler(
    new Request('https://utekos.no/api/events/page-view', {
      method: 'POST'
    }),
    {
      classifyTraffic: async () => ({
        classification: 'synthetic',
        excludeFromMarketingDispatch: true
      }),
      collect: async () => {
        collected = true
        return new Response(null, { status: 202 })
      }
    }
  )

  assert.equal(collected, false)
  assert.equal(response.status, 204)
  assert.equal(
    response.headers.get('X-Utekos-Traffic-Classification'),
    'synthetic'
  )
  assert.equal(
    response.headers.get('Cache-Control'),
    'no-store, max-age=0'
  )
})
