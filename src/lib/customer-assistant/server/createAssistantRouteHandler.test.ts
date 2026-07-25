import assert from 'node:assert/strict'
import test from 'node:test'
import type { UIMessage as ReactClientUIMessage } from '@ai-sdk/react'
import type {
  AssistantChatRequest,
  AssistantUIMessage
} from '../assistantProtocol'
import { createAssistantViewRows } from '@/components/customer-assistant/assistantViewModel'
import {
  answerAssistantRequest,
  type AssistantOutcome
} from './answerAssistantRequest'
import {
  createAssistantRouteHandler,
  createProcessLocalAssistantRateLimiter,
  resolveAssistantRequestsPerMinute,
  type AssistantRouteDependencies
} from './createAssistantRouteHandler'
import {
  __TEST_ONLY__,
  normalizeAssistantProduct
} from './shopifyAssistantCatalog'

const sessionId = 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7'
const question = 'Jeg trenger noe til båten.'
const clientMessageTypeIsCompatible: AssistantUIMessage extends (
  ReactClientUIMessage
) ?
  true
: false = true

const validPayload: AssistantChatRequest = {
  id: 'assistant-chat',
  sessionId,
  intent: 'product_help',
  messages: [
    {
      id: 'message-1',
      role: 'user',
      parts: [{ type: 'text', text: question }]
    }
  ],
  pageContext: { pathname: '/produkter', productHandle: null }
}

const outcome: AssistantOutcome = {
  text: 'Jeg anbefaler Utekos TechDown.',
  confidence: 'high',
  recommendations: [
    {
      rank: 1,
      reason: 'Passer til båt og fukt.',
      isPrimary: true,
      product: {
        id: 'gid://shopify/Product/1',
        handle: 'utekos-techdown',
        title: 'Utekos TechDown',
        href: '/produkter/utekos-techdown',
        availableForSale: true,
        image: null,
        price: { amount: '2499.00', currencyCode: 'NOK' },
        variants: []
      }
    }
  ],
  sources: [
    {
      title: 'Frakt og retur',
      url: 'https://utekos.no/frakt-og-retur'
    }
  ],
  handoff: {
    contactPath: '/kontaktskjema',
    email: 'kundeservice@utekos.no',
    phone: '+4740216343',
    reason: 'uncertain'
  },
  failureCode: 'none'
}

function createRequest({
  body = JSON.stringify(validPayload),
  contentType = 'application/json',
  declaredLength,
  origin = 'https://utekos.no',
  requestOrigin = 'https://utekos.no'
}: {
  body?: string
  contentType?: string | null
  declaredLength?: string
  origin?: string | null
  requestOrigin?: string
} = {}) {
  const headers = new Headers()
  if (contentType !== null)
    headers.set('Content-Type', contentType)
  if (declaredLength !== undefined) {
    headers.set('Content-Length', declaredLength)
  }
  if (origin !== null) headers.set('Origin', origin)

  return new Request(
    `${requestOrigin}/api/customer-assistant/chat`,
    { body, headers, method: 'POST' }
  )
}

function createDependencies(
  overrides: Partial<AssistantRouteDependencies> = {}
): AssistantRouteDependencies {
  return {
    answer: async () => outcome,
    checkRateLimit: async () => ({ allowed: true }),
    now: () => 1_000,
    ...overrides
  }
}

async function assertErrorResponse(
  response: Response,
  status: number,
  error: string
) {
  assert.equal(response.status, status)
  assert.deepEqual(await response.json(), { error })
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, max-age=0'
  )
}

function parseSseChunks(body: string) {
  return body
    .split('\n\n')
    .map(event => event.trim())
    .filter(event => event.startsWith('data: '))
    .map(event => event.slice('data: '.length))
    .filter(data => data !== '[DONE]')
    .map(data => JSON.parse(data) as Record<string, unknown>)
}

test('rejects missing and cross-origin requests', async t => {
  let dependencyCalls = 0
  const handler = createAssistantRouteHandler(
    createDependencies({
      answer: async () => {
        dependencyCalls += 1
        return outcome
      },
      checkRateLimit: async () => {
        dependencyCalls += 1
        return { allowed: true }
      }
    })
  )

  await t.test('missing Origin', async () => {
    await assertErrorResponse(
      await handler(createRequest({ origin: null })),
      403,
      'forbidden_origin'
    )
  })

  await t.test('cross Origin', async () => {
    await assertErrorResponse(
      await handler(
        createRequest({
          origin: 'https://utekos.no.evil.example'
        })
      ),
      403,
      'forbidden_origin'
    )
  })

  assert.equal(dependencyCalls, 0)
})

test('the direct AI SDK 6 message type is compatible with the installed React client type', () => {
  assert.equal(clientMessageTypeIsCompatible, true)
})

test('route composition exposes requests only in verified Vercel previews', () => {
  assert.equal(
    resolveAssistantRequestsPerMinute({
      VERCEL_ENV: 'preview',
      CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '25'
    }),
    12
  )

  for (const environment of [
    {
      VERCEL_ENV: 'production',
      CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '100'
    },
    {
      VERCEL_ENV: 'preview',
      CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '0'
    },
    {
      VERCEL_ENV: 'preview',
      CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: 'invalid'
    },
    { VERCEL_ENV: 'preview' },
    {
      VERCEL_ENV: 'PREVIEW',
      CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '25'
    }
  ]) {
    assert.equal(
      resolveAssistantRequestsPerMinute(environment),
      0
    )
  }
})

test('rejects requests without the JSON media type', async () => {
  const handler = createAssistantRouteHandler(
    createDependencies()
  )

  await assertErrorResponse(
    await handler(createRequest({ contentType: 'text/plain' })),
    415,
    'unsupported_media_type'
  )
})

test('accepts a case-insensitive JSON media type with parameters', async () => {
  const handler = createAssistantRouteHandler(
    createDependencies()
  )
  const response = await handler(
    createRequest({
      contentType: 'Application/JSON ; Charset="utf-8"',
      origin: 'https://UTEKOS.NO:443'
    })
  )

  assert.equal(response.status, 200)
  await response.text()
})

test('rejects folded or malformed JSON media types', async t => {
  const handler = createAssistantRouteHandler(
    createDependencies()
  )

  for (const contentType of [
    'application/json; charset=utf-8, text/plain',
    'application/json, text/plain',
    'application/json; charset',
    'application/json; charset =utf-8',
    'application/json; charset=',
    'application/json; charset="utf-8',
    'application/json;'
  ]) {
    await t.test(contentType, async () => {
      await assertErrorResponse(
        await handler(createRequest({ contentType })),
        415,
        'unsupported_media_type'
      )
    })
  }
})

test('rejects declared and actual bodies over 24 KiB', async t => {
  const handler = createAssistantRouteHandler(
    createDependencies()
  )

  await t.test('declared bytes', async () => {
    await assertErrorResponse(
      await handler(createRequest({ declaredLength: '24577' })),
      413,
      'payload_too_large'
    )
  })

  await t.test('actual UTF-8 bytes', async () => {
    await assertErrorResponse(
      await handler(
        createRequest({ body: 'ø'.repeat(12 * 1024 + 1) })
      ),
      413,
      'payload_too_large'
    )
  })
})

test('rejects malformed Content-Length values as invalid requests', async t => {
  const handler = createAssistantRouteHandler(
    createDependencies()
  )

  for (const declaredLength of [
    '24577, 1',
    '-1',
    '+1',
    '1.5',
    'not-a-number',
    '9007199254740992'
  ]) {
    await t.test(declaredLength, async () => {
      await assertErrorResponse(
        await handler(createRequest({ declaredLength })),
        400,
        'invalid_request'
      )
    })
  }
})

test('maps invalid JSON and schema input to invalid_request', async t => {
  const handler = createAssistantRouteHandler(
    createDependencies()
  )

  await t.test('invalid JSON', async () => {
    await assertErrorResponse(
      await handler(createRequest({ body: '{' })),
      400,
      'invalid_request'
    )
  })

  await t.test('invalid schema', async () => {
    await assertErrorResponse(
      await handler(
        createRequest({ body: JSON.stringify({ sessionId }) })
      ),
      400,
      'invalid_request'
    )
  })
})

test('returns a bounded rate-limit response without answering', async () => {
  let answerCalls = 0
  const handler = createAssistantRouteHandler(
    createDependencies({
      answer: async () => {
        answerCalls += 1
        return outcome
      },
      checkRateLimit: async input => {
        assert.equal(input.sessionId, sessionId)
        assert.equal(input.request.method, 'POST')
        return { allowed: false }
      }
    })
  )

  const response = await handler(createRequest())

  await assertErrorResponse(response, 429, 'rate_limited')
  assert.equal(response.headers.get('retry-after'), '60')
  assert.equal(answerCalls, 0)
})

test('fails closed when the rate limiter is unavailable', async () => {
  const handler = createAssistantRouteHandler(
    createDependencies({
      checkRateLimit: async () => {
        throw new Error('limiter connection detail')
      }
    })
  )
  const response = await handler(createRequest())

  await assertErrorResponse(response, 429, 'rate_limited')
  assert.equal(response.headers.get('retry-after'), '60')
})

test('streams typed text and data parts with only safe structured completion logs', async () => {
  const logged: unknown[][] = []
  const originalInfo = console.info
  const received: unknown[][] = []
  const times = [1_000, 1_042]
  console.info = (...values: unknown[]) => logged.push(values)

  try {
    const handler = createAssistantRouteHandler(
      createDependencies({
        answer: async (...args) => {
          received.push(args)
          return outcome
        },
        now: () => times.shift() ?? 1_042
      })
    )
    const request = createRequest()
    const response = await handler(request, {
      buyerIp: '203.0.113.8'
    })

    assert.equal(response.status, 200)
    assert.equal(
      response.headers.get('cache-control'),
      'no-store, max-age=0'
    )
    assert.equal(
      response.headers.get('x-vercel-ai-ui-message-stream'),
      'v1'
    )

    const chunks = parseSseChunks(await response.text())
    const emittedParts = chunks.filter(
      chunk => chunk.type !== 'start' && chunk.type !== 'finish'
    )

    assert.deepEqual(
      emittedParts.map(chunk => chunk.type),
      [
        'text-start',
        'text-delta',
        'text-end',
        'data-recommendation',
        'data-source',
        'data-handoff',
        'data-status'
      ]
    )
    assert.equal(emittedParts[1]?.delta, outcome.text)
    assert.equal(emittedParts[0]?.id, emittedParts[1]?.id)
    assert.equal(emittedParts[1]?.id, emittedParts[2]?.id)
    assert.deepEqual(
      emittedParts[3]?.data,
      outcome.recommendations[0]
    )
    assert.deepEqual(emittedParts[4]?.data, outcome.sources[0])
    assert.deepEqual(emittedParts[5]?.data, outcome.handoff)
    assert.deepEqual(emittedParts[6]?.data, {
      confidence: 'high',
      failureCode: 'none'
    })
    assert.deepEqual(received, [
      [validPayload, { buyerIp: '203.0.113.8', failureCount: 0 }]
    ])

    assert.deepEqual(logged, [
      [
        JSON.stringify({
          sessionId,
          intent: 'product_help',
          outcomeCode: 'none',
          latencyMs: 42
        })
      ]
    ])
    const serializedLogs = JSON.stringify(logged)
    assert.doesNotMatch(serializedLogs, /Jeg trenger/u)
    assert.doesNotMatch(serializedLogs, /203\.0\.113\.8/u)
  } finally {
    console.info = originalInfo
  }
})

test('validates recommendation products before writing any stream content', async () => {
  const logged: unknown[][] = []
  const originalInfo = console.info
  console.info = (...values: unknown[]) => logged.push(values)

  try {
    const unsafeOutcome = {
      ...outcome,
      recommendations: [
        {
          ...outcome.recommendations[0],
          product: {
            ...outcome.recommendations[0]?.product,
            quantityAvailable: 17
          }
        }
      ]
    } as unknown as AssistantOutcome
    const handler = createAssistantRouteHandler(
      createDependencies({ answer: async () => unsafeOutcome })
    )

    const body = await (await handler(createRequest())).text()

    assert.match(body, /Jeg fikk ikke hentet et sikkert svar/u)
    assert.doesNotMatch(
      body,
      /Jeg anbefaler Utekos TechDown|quantityAvailable|\b17\b/u
    )
    assert.match(JSON.stringify(logged), /stream_error/u)
  } finally {
    console.info = originalInfo
  }
})

test('preserves one strict product shape from Shopify normalization through stream and client parsing', async () => {
  const longTitle =
    `Utekos TechDown ${'varm '.repeat(80)}`.trim()
  const longOption = 'tilpasning-'.repeat(40)
  const product = normalizeAssistantProduct({
    id: 'gid://shopify/Product/boundary',
    handle: 'utekos-techdown',
    title: longTitle,
    availableForSale: true,
    featuredImage: {
      altText: null,
      url: 'https://cdn.shopify.com/s/files/boundary.webp'
    },
    priceRange: {
      minVariantPrice: {
        amount: '2499.0000',
        currencyCode: 'NOK'
      }
    },
    variants: {
      pageInfo: { hasNextPage: false, endCursor: null },
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/boundary',
            title: longOption,
            availableForSale: true,
            selectedOptions: [
              { name: 'Tilpasning', value: longOption }
            ]
          }
        }
      ]
    }
  })
  const handler = createAssistantRouteHandler(
    createDependencies({
      answer: async () => ({
        ...outcome,
        recommendations: [
          {
            product,
            rank: 1,
            reason: 'Passer til båt og fukt.',
            isPrimary: true
          }
        ]
      })
    })
  )
  const chunks = parseSseChunks(
    await (await handler(createRequest())).text()
  )
  const recommendation = chunks.find(
    chunk => chunk.type === 'data-recommendation'
  )
  const rows = createAssistantViewRows([
    {
      id: 'boundary-message',
      role: 'assistant',
      parts: [
        {
          type: 'data-recommendation',
          data: recommendation?.data
        }
      ]
    } as AssistantUIMessage
  ])
  const row = rows.find(
    candidate => candidate.kind === 'recommendation'
  )

  assert.equal(row?.kind, 'recommendation')
  if (row?.kind !== 'recommendation') return
  assert.equal(row.recommendation.product.title, longTitle)
  assert.equal(row.recommendation.product.image?.alt, longTitle)
  assert.equal(
    row.recommendation.product.variants[0]?.selectedOptions[0]
      ?.value,
    longOption
  )
})

test('streams the safe Shopify timeout handoff after the catalog aborts', async () => {
  let signal: AbortSignal | undefined
  const fetchProducts =
    __TEST_ONLY__.createFetchAssistantProducts(
      async input => {
        signal = input.signal

        return await new Promise((_, reject) => {
          input.signal?.addEventListener(
            'abort',
            () =>
              reject(
                new Error('private provider timeout detail')
              ),
            { once: true }
          )
        })
      },
      { deadlineMs: 5 }
    )
  const handler = createAssistantRouteHandler(
    createDependencies({
      answer: (request, context) =>
        answerAssistantRequest(request, context, {
          fetchProducts,
          supportKnowledge: {
            answer: async () => ({
              text: 'unused',
              confidence: 'high',
              sources: []
            })
          },
          commerceRecommendation: { recommend: async () => [] }
        })
    })
  )
  const timeoutPayload = {
    ...validPayload,
    messages: [
      {
        id: 'message-timeout',
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Jeg trenger noe til båt og fukt.'
          }
        ]
      }
    ]
  }
  const startedAt = performance.now()
  const body = await (
    await handler(
      createRequest({ body: JSON.stringify(timeoutPayload) })
    )
  ).text()

  assert.equal(signal?.aborted, true)
  assert.ok(performance.now() - startedAt < 5_000)
  assert.match(body, /shopify_unavailable/u)
  assert.match(body, /data-handoff/u)
  assert.match(
    body,
    /Jeg fikk ikke kontrollert produktinformasjonen akkurat nå/u
  )
  assert.doesNotMatch(body, /private provider timeout detail/u)
})

test('uses a safe stream error without exposing question, IP, or thrown text', async () => {
  const logged: unknown[][] = []
  const originalInfo = console.info
  const times = [2_000, 2_007]
  console.info = (...values: unknown[]) => logged.push(values)

  try {
    const handler = createAssistantRouteHandler(
      createDependencies({
        answer: async () => {
          throw new Error(
            `provider secret for ${question} at 203.0.113.8`
          )
        },
        now: () => times.shift() ?? 2_007
      })
    )
    const response = await handler(createRequest(), {
      buyerIp: '203.0.113.8'
    })
    const body = await response.text()

    assert.equal(response.status, 200)
    assert.match(
      body,
      /Jeg fikk ikke hentet et sikkert svar\. Du kan kontakte kundeservice\./u
    )
    assert.doesNotMatch(
      body,
      /provider secret|Jeg trenger|203\.0\.113\.8/u
    )
    assert.deepEqual(logged, [
      [
        JSON.stringify({
          sessionId,
          intent: 'product_help',
          outcomeCode: 'stream_error',
          latencyMs: 7
        })
      ]
    ])
  } finally {
    console.info = originalInfo
  }
})

test('the process-local limiter allows 12 requests per minute per session', async () => {
  let timestamp = 10_000
  const checkRateLimit = createProcessLocalAssistantRateLimiter({
    limit: 12,
    now: () => timestamp
  })
  const request = createRequest()

  for (let index = 0; index < 12; index += 1) {
    assert.deepEqual(
      await checkRateLimit({ sessionId, request }),
      { allowed: true }
    )
  }

  assert.deepEqual(
    await checkRateLimit({ sessionId, request }),
    { allowed: false }
  )
  assert.deepEqual(
    await checkRateLimit({
      sessionId: 'ba20a657-7040-4d69-b143-07588834b06c',
      request
    }),
    { allowed: true }
  )

  timestamp += 60_000
  assert.deepEqual(
    await checkRateLimit({ sessionId, request }),
    { allowed: true }
  )
})

test('a zero request limit keeps production traffic disabled', async () => {
  const checkRateLimit = createProcessLocalAssistantRateLimiter({
    limit: 0,
    now: () => 0
  })

  assert.deepEqual(
    await checkRateLimit({
      sessionId,
      request: createRequest()
    }),
    { allowed: false }
  )
})
