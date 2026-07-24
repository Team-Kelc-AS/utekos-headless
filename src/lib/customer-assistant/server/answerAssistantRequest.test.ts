import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assistantSourceSchema,
  type AssistantChatRequest,
  type AssistantProduct
} from '../assistantProtocol'
import type {
  AssistantAdapters,
  AssistantRequestContext
} from './assistantAdapters'
import { answerAssistantRequest } from './answerAssistantRequest'
import { staticSupportKnowledgeAdapter } from './staticSupportKnowledge'

const sessionId = 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7'

function createRequest(
  input: Partial<AssistantChatRequest> & { text: string }
): AssistantChatRequest {
  return {
    sessionId,
    intent: input.intent ?? 'product_help',
    messages: input.messages ?? [
      {
        id: 'message-1',
        role: 'user',
        parts: [{ type: 'text', text: input.text }]
      }
    ],
    pageContext: input.pageContext ?? {
      pathname: '/produkter',
      productHandle: null
    }
  }
}

function createProduct(
  input: Partial<AssistantProduct> & {
    handle: string
    available?: boolean
  }
): AssistantProduct {
  return {
    id: input.id ?? `gid://shopify/Product/${input.handle}`,
    handle: input.handle,
    title: input.title ?? input.handle,
    href: input.href ?? `/produkter/${input.handle}`,
    image: input.image ?? null,
    price: input.price ?? {
      amount: '2499.00',
      currencyCode: 'NOK'
    },
    variants: input.variants ?? [
      {
        id: `gid://shopify/ProductVariant/${input.handle}`,
        title: 'Medium',
        availableForSale: input.available ?? true,
        selectedOptions: [{ name: 'Størrelse', value: 'M' }]
      }
    ]
  }
}

const context: AssistantRequestContext = {
  buyerIp: '203.0.113.8',
  failureCount: 0
}

function createAdapters(
  overrides: Partial<AssistantAdapters> = {}
): AssistantAdapters {
  return {
    fetchProducts: async () => [],
    supportKnowledge: staticSupportKnowledgeAdapter,
    commerceRecommendation: { recommend: async () => [] },
    ...overrides
  }
}

test('product help reads Shopify, applies matching, and emits product recommendations', async () => {
  const catalogCalls: unknown[] = []
  const recommendationCalls: unknown[] = []
  const products = [
    createProduct({
      id: 'product-techdown',
      handle: 'utekos-techdown',
      title: 'Utekos TechDown'
    }),
    createProduct({
      id: 'product-dun',
      handle: 'utekos-dun',
      title: 'Utekos Dun'
    })
  ]

  const outcome = await answerAssistantRequest(
    createRequest({ text: 'Jeg skal bruke den i båt og fukt.' }),
    context,
    createAdapters({
      fetchProducts: async input => {
        catalogCalls.push(input)
        return products
      },
      commerceRecommendation: {
        recommend: async input => {
          recommendationCalls.push(input)
          return []
        }
      }
    })
  )

  assert.deepEqual(catalogCalls, [{ buyerIp: context.buyerIp }])
  assert.deepEqual(recommendationCalls, [
    { productIds: ['product-techdown'], sessionId }
  ])
  assert.equal(outcome.failureCode, 'none')
  assert.equal(outcome.confidence, 'high')
  assert.equal(outcome.recommendations.length, 1)
  assert.equal(
    outcome.recommendations[0]?.product.handle,
    'utekos-techdown'
  )
  assert.equal(outcome.recommendations[0]?.rank, 1)
  assert.equal(outcome.recommendations[0]?.isPrimary, true)
  assert.equal(outcome.handoff, null)
})

test('stock help reports only available or unavailable without quantity claims', async () => {
  for (const [available, expected] of [
    [true, 'Utekos TechDown er tilgjengelig.'],
    [false, 'Utekos TechDown er ikke tilgjengelig.']
  ] as const) {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'stock_help',
        text: 'Har dere 17 igjen?',
        pageContext: {
          pathname: '/produkter/utekos-techdown',
          productHandle: 'utekos-techdown'
        }
      }),
      context,
      createAdapters({
        fetchProducts: async input => {
          assert.deepEqual(input, {
            buyerIp: context.buyerIp,
            handles: ['utekos-techdown']
          })
          return [
            createProduct({
              handle: 'utekos-techdown',
              title: 'Utekos TechDown',
              available
            })
          ]
        }
      })
    )

    assert.equal(outcome.text, expected)
    assert.doesNotMatch(
      outcome.text,
      /\b17\b|\b\d+\s+(?:igjen|på lager)\b/u
    )
    assert.equal(outcome.failureCode, 'none')
  }
})

test('shipping and returns uses the current FAQ and emits its canonical source', async () => {
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'shipping_returns',
      text: 'Hva koster frakten?'
    }),
    context,
    createAdapters()
  )

  assert.equal(
    outcome.text,
    'Vi tilbyr fri frakt på alle bestillinger over 999 kr i hele Norge. For bestillinger under dette beløpet har vi fraktkostnad på 99 kr.'
  )
  assert.deepEqual(outcome.sources, [
    {
      title: 'Frakt og retur',
      url: 'https://utekos.no/frakt-og-retur'
    }
  ])
  assert.equal(outcome.failureCode, 'none')
  outcome.sources.forEach(source =>
    assistantSourceSchema.parse(source)
  )
})

test('size help emits the guarded size-guide answer without promising fit', async () => {
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'size_help',
      text: 'Hvilken størrelse passer meg?'
    }),
    context,
    createAdapters()
  )

  assert.match(outcome.text, /sammenlign målene/iu)
  assert.match(outcome.text, /kan ikke garantere/iu)
  assert.doesNotMatch(
    outcome.text,
    /(?:garantert|vil|kommer til å) passe/iu
  )
  assert.deepEqual(outcome.sources, [
    {
      title: 'Størrelsesguide',
      url: 'https://utekos.no/handlehjelp/storrelsesguide'
    }
  ])
  assert.equal(outcome.failureCode, 'none')
})

test('restricted intents return handoff without querying providers', async () => {
  let providerCalls = 0
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'other',
      text: 'Hvor er ordren min 12345?'
    }),
    context,
    createAdapters({
      fetchProducts: async () => {
        providerCalls += 1
        return []
      },
      supportKnowledge: {
        answer: async () => {
          providerCalls += 1
          return {
            text: 'Skal ikke brukes',
            confidence: 'high',
            sources: []
          }
        }
      },
      commerceRecommendation: {
        recommend: async () => {
          providerCalls += 1
          return []
        }
      }
    })
  )

  assert.equal(providerCalls, 0)
  assert.equal(outcome.handoff?.reason, 'order')
  assert.equal(outcome.failureCode, 'none')
  assert.deepEqual(outcome.recommendations, [])
  assert.deepEqual(outcome.sources, [])
})

test('Shopify failure returns safe support and handoff without a product claim or leaked log data', async () => {
  const logged: unknown[][] = []
  const originalError = console.error
  console.error = (...values: unknown[]) => logged.push(values)

  try {
    const outcome = await answerAssistantRequest(
      createRequest({
        text: 'Jeg trenger noe til båt og fukt.'
      }),
      context,
      createAdapters({
        fetchProducts: async () => {
          throw new Error(
            'provider secret and customer text: Jeg trenger noe til båt'
          )
        }
      })
    )

    assert.equal(outcome.failureCode, 'shopify_unavailable')
    assert.equal(outcome.confidence, 'low')
    assert.deepEqual(outcome.recommendations, [])
    assert.deepEqual(outcome.sources, [])
    assert.equal(outcome.handoff?.reason, 'uncertain')
    assert.doesNotMatch(
      outcome.text,
      /TechDown|Dun|Mikrofiber|Comfyrobe|pris|lager|tilgjengelig/iu
    )
    assert.deepEqual(logged, [])
  } finally {
    console.error = originalError
  }
})

test('knowledge failure hands off without inventing an answer or leaking thrown text', async () => {
  const logged: unknown[][] = []
  const originalWarn = console.warn
  console.warn = (...values: unknown[]) => logged.push(values)

  try {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'shipping_returns',
        text: 'Når kommer pakken?'
      }),
      context,
      createAdapters({
        supportKnowledge: {
          answer: async () => {
            throw new Error('Når kommer pakken? provider detail')
          }
        }
      })
    )

    assert.equal(outcome.failureCode, 'knowledge_unavailable')
    assert.equal(outcome.confidence, 'low')
    assert.equal(outcome.handoff?.reason, 'uncertain')
    assert.deepEqual(outcome.sources, [])
    assert.equal(
      outcome.text,
      'Jeg fikk ikke hentet et sikkert svar. Kundeservice kan hjelpe deg videre.'
    )
    assert.deepEqual(logged, [])
  } finally {
    console.warn = originalWarn
  }
})

test('underspecified product help asks the next bounded clarification without provider calls', async () => {
  let providerCalls = 0
  const outcome = await answerAssistantRequest(
    createRequest({ text: 'Jeg trenger hjelp til å velge.' }),
    context,
    createAdapters({
      fetchProducts: async () => {
        providerCalls += 1
        return []
      },
      commerceRecommendation: {
        recommend: async () => {
          providerCalls += 1
          return []
        }
      }
    })
  )

  assert.equal(providerCalls, 0)
  assert.equal(
    outcome.text,
    'Hvor ser du først og fremst for deg å bruke plagget – for eksempel på hytta, i båten, i bobilen eller i hverdagen?'
  )
  assert.equal(outcome.failureCode, 'none')
  assert.equal(outcome.handoff, null)
})

test('recommendation provider failure preserves deterministic products with a stable code', async () => {
  const outcome = await answerAssistantRequest(
    createRequest({ text: 'Jeg skal bruke den i båt og fukt.' }),
    context,
    createAdapters({
      fetchProducts: async () => [
        createProduct({
          id: 'product-techdown',
          handle: 'utekos-techdown',
          title: 'Utekos TechDown'
        })
      ],
      commerceRecommendation: {
        recommend: async () => {
          throw new Error(
            'unsafe recommendation provider detail'
          )
        }
      }
    })
  )

  assert.equal(outcome.failureCode, 'recommendation_unavailable')
  assert.equal(outcome.recommendations.length, 1)
  assert.equal(
    outcome.recommendations[0]?.product.handle,
    'utekos-techdown'
  )
})

test('invalid provider sources fail closed and no ungrounded support answer is emitted', async () => {
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'shipping_returns',
      text: 'Hva koster frakten?'
    }),
    context,
    createAdapters({
      supportKnowledge: {
        answer: async () => ({
          text: 'Fri frakt.',
          confidence: 'high',
          sources: [
            {
              title: 'Ugyldig',
              url: 'https://example.com/source'
            }
          ]
        })
      }
    })
  )

  assert.equal(outcome.failureCode, 'knowledge_unavailable')
  assert.deepEqual(outcome.sources, [])
  assert.doesNotMatch(outcome.text, /fri frakt/iu)
  assert.equal(outcome.handoff?.reason, 'uncertain')
})

test('unsupported knowledge returns a no-grounded-answer handoff', async () => {
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'other',
      text: 'Kan dere gi medisinske råd?'
    }),
    context,
    createAdapters()
  )

  assert.equal(outcome.failureCode, 'no_grounded_answer')
  assert.equal(outcome.confidence, 'low')
  assert.equal(outcome.handoff?.reason, 'uncertain')
  assert.deepEqual(outcome.sources, [])
})
