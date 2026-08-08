import assert from 'node:assert/strict'
import test from 'node:test'
import { shippingReturnsFaqItems } from '@/app/frakt-og-retur/data/shippingReturnsContent'
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
const useQuestion =
  'Hvor ser du først og fremst for deg å bruke plagget – for eksempel på hytten, i båten, i bobilen eller i hverdagen?'
const priorityQuestion =
  'Hva er viktigst for deg: mest mulig varme, lav vekt, værbeskyttelse eller enkelt vedlikehold?'

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
    availableForSale:
      input.availableForSale ?? input.available ?? true,
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

function createSharedColorProduct({
  reverseCatalogAndDimensionOrder = false,
  uniformAvailability = false
}: {
  reverseCatalogAndDimensionOrder?: boolean
  uniformAvailability?: boolean
} = {}): AssistantProduct {
  const variants: AssistantProduct['variants'] = [
    {
      id: 'variant-blue-blue',
      title: 'Blue / Blue',
      availableForSale: true,
      selectedOptions: [
        { name: 'Hovedfarge', value: 'Blå' },
        { name: 'Detaljfarge', value: 'Blå' }
      ]
    },
    {
      id: 'variant-blue-white',
      title: 'Blue / White',
      availableForSale: uniformAvailability,
      selectedOptions: [
        { name: 'Hovedfarge', value: 'Blå' },
        { name: 'Detaljfarge', value: 'Hvit' }
      ]
    },
    {
      id: 'variant-black-blue',
      title: 'Black / Blue',
      availableForSale: true,
      selectedOptions: [
        { name: 'Hovedfarge', value: 'Svart' },
        { name: 'Detaljfarge', value: 'Blå' }
      ]
    }
  ]
  const orderedVariants =
    reverseCatalogAndDimensionOrder ?
      variants
        .toReversed()
        .map(variant => ({
          ...variant,
          selectedOptions: variant.selectedOptions.toReversed()
        }))
    : variants

  return createProduct({
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    variants: orderedVariants
  })
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

function createObservedAdapters(products: AssistantProduct[]) {
  const calls = { shopify: 0, knowledge: 0, recommendation: 0 }
  const adapters = createAdapters({
    fetchProducts: async () => {
      calls.shopify += 1
      return products
    },
    supportKnowledge: {
      answer: async input => {
        calls.knowledge += 1
        return staticSupportKnowledgeAdapter.answer(input)
      }
    },
    commerceRecommendation: {
      recommend: async () => {
        calls.recommendation += 1
        return []
      }
    }
  })

  return { adapters, calls }
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

  assert.deepEqual(catalogCalls, [{}])
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

test('stock help resolves a product and variant through live Shopify outside a product page', async () => {
  let catalogCalls = 0
  const adapters = createAdapters({
    fetchProducts: async input => {
      catalogCalls += 1
      assert.deepEqual(input, {})
      return [
        createProduct({
          handle: 'utekos-techdown',
          title: 'Utekos TechDown™',
          variants: [
            {
              id: 'variant-medium',
              title: 'Havdyp / Middels',
              availableForSale: true,
              selectedOptions: [
                { name: 'Farge', value: 'Havdyp' },
                { name: 'Størrelse', value: 'Middels' }
              ]
            },
            {
              id: 'variant-large',
              title: 'Havdyp / Stor',
              availableForSale: false,
              selectedOptions: [
                { name: 'Farge', value: 'Havdyp' },
                { name: 'Størrelse', value: 'Stor' }
              ]
            }
          ]
        })
      ]
    }
  })

  const initial = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Hjelp meg å sjekke lagerstatus.'
    }),
    context,
    adapters
  )

  assert.equal(catalogCalls, 0)
  assert.match(initial.text, /Hvilket produkt/iu)
  assert.equal(initial.handoff, null)

  const resolved = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'TechDown i Middels og Havdyp',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Hjelp meg å sjekke lagerstatus.'
            }
          ]
        },
        {
          id: 'message-2',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: 'Hvilket produkt vil du sjekke?'
            }
          ]
        },
        {
          id: 'message-3',
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'TechDown i Middels og Havdyp'
            }
          ]
        }
      ]
    }),
    context,
    adapters
  )

  assert.equal(catalogCalls, 1)
  assert.equal(
    resolved.text,
    'Utekos TechDown™ i Havdyp / Middels er tilgjengelig.'
  )
  assert.doesNotMatch(
    resolved.text,
    /\b\d+\s+(?:igjen|på lager)\b/u
  )
  assert.equal(resolved.failureCode, 'none')
  assert.equal(
    resolved.sources[0]?.url,
    'https://utekos.no/produkter/utekos-techdown'
  )
})

test('whole-product stock uses Shopify product availability rather than inferring from variants', async () => {
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Er den tilgjengelig?',
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({
      fetchProducts: async () => [
        createProduct({
          handle: 'utekos-techdown',
          title: 'Utekos TechDown',
          availableForSale: false,
          variants: [
            {
              id: 'variant-m',
              title: 'Medium',
              availableForSale: true,
              selectedOptions: [
                { name: 'Størrelse', value: 'M' }
              ]
            }
          ]
        })
      ]
    })
  )

  assert.equal(
    outcome.text,
    'Utekos TechDown er ikke tilgjengelig.'
  )
  assert.equal(outcome.failureCode, 'none')
})

test('stock help resolves an explicitly requested variant option exactly', async () => {
  const product = createProduct({
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    availableForSale: true,
    variants: [
      {
        id: 'variant-m',
        title: 'Medium',
        availableForSale: false,
        selectedOptions: [{ name: 'Størrelse', value: 'M' }]
      },
      {
        id: 'variant-l',
        title: 'Large',
        availableForSale: true,
        selectedOptions: [{ name: 'Størrelse', value: 'L' }]
      }
    ]
  })

  for (const [question, option, availability] of [
    ['Har dere M på lager?', 'M', 'ikke tilgjengelig'],
    ['Jeg ønsker M', 'M', 'ikke tilgjengelig'],
    ['Er størrelse L tilgjengelig?', 'L', 'tilgjengelig']
  ] as const) {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'stock_help',
        text: question,
        pageContext: {
          pathname: '/produkter/utekos-techdown',
          productHandle: 'utekos-techdown'
        }
      }),
      context,
      createAdapters({ fetchProducts: async () => [product] })
    )

    assert.equal(
      outcome.text,
      `Utekos TechDown i ${option} er ${availability}.`,
      question
    )
    assert.equal(outcome.confidence, 'high', question)
    assert.equal(outcome.failureCode, 'none', question)
  }
})

test('stock help resolves the exact Shopify variant from choices across user turns', async () => {
  const product = createProduct({
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    availableForSale: true,
    variants: [
      {
        id: 'variant-m-blue',
        title: 'Medium / Blue',
        availableForSale: false,
        selectedOptions: [
          { name: 'Størrelse', value: 'M' },
          { name: 'Farge', value: 'Blå' }
        ]
      },
      {
        id: 'variant-m-black',
        title: 'Medium / Black',
        availableForSale: true,
        selectedOptions: [
          { name: 'Størrelse', value: 'M' },
          { name: 'Farge', value: 'Svart' }
        ]
      },
      {
        id: 'variant-l-blue',
        title: 'Large / Blue',
        availableForSale: true,
        selectedOptions: [
          { name: 'Størrelse', value: 'L' },
          { name: 'Farge', value: 'Blå' }
        ]
      }
    ]
  })

  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Er den i blå tilgjengelig?',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [
            { type: 'text', text: 'Jeg vil ha størrelse M.' }
          ]
        },
        {
          id: 'message-2',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: 'Hvilken farge vil du sjekke?'
            }
          ]
        },
        {
          id: 'message-3',
          role: 'user',
          parts: [
            { type: 'text', text: 'Er den i blå tilgjengelig?' }
          ]
        }
      ],
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({ fetchProducts: async () => [product] })
  )

  assert.equal(
    outcome.text,
    'Utekos TechDown i M / Blå er ikke tilgjengelig.'
  )
  assert.equal(outcome.confidence, 'high')
  assert.equal(outcome.failureCode, 'none')
})

test('stock help replaces earlier option choices and clarifies same-turn conflicts', async () => {
  const product = createProduct({
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    availableForSale: true,
    variants: [
      {
        id: 'variant-m-blue',
        title: 'Medium / Blue',
        availableForSale: false,
        selectedOptions: [
          { name: 'Størrelse', value: 'M' },
          { name: 'Farge', value: 'Blå' }
        ]
      },
      {
        id: 'variant-l-blue',
        title: 'Large / Blue',
        availableForSale: true,
        selectedOptions: [
          { name: 'Størrelse', value: 'L' },
          { name: 'Farge', value: 'Blå' }
        ]
      }
    ]
  })

  const replacedChoice = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Er den blå tilgjengelig?',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Jeg trenger M.' }]
        },
        {
          id: 'message-2',
          role: 'user',
          parts: [{ type: 'text', text: 'Bytt til L.' }]
        },
        {
          id: 'message-3',
          role: 'user',
          parts: [
            { type: 'text', text: 'Er den blå tilgjengelig?' }
          ]
        }
      ],
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({ fetchProducts: async () => [product] })
  )

  assert.equal(
    replacedChoice.text,
    'Utekos TechDown i L / Blå er tilgjengelig.'
  )

  const conflict = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Har dere M eller L i blå?',
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({ fetchProducts: async () => [product] })
  )

  assert.equal(
    conflict.text,
    'Hvilken størrelse, farge eller variant vil du sjekke?'
  )
  assert.equal(conflict.confidence, 'medium')
  assert.equal(conflict.failureCode, 'none')
  assert.deepEqual(conflict.sources, [])
})

test('a later explicit choice resolves an earlier same-dimension ambiguity', async () => {
  const product = createProduct({
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    variants: [
      {
        id: 'variant-m-blue',
        title: 'Medium / Blue',
        availableForSale: false,
        selectedOptions: [
          { name: 'Størrelse', value: 'M' },
          { name: 'Farge', value: 'Blå' }
        ]
      },
      {
        id: 'variant-l-blue',
        title: 'Large / Blue',
        availableForSale: true,
        selectedOptions: [
          { name: 'Størrelse', value: 'L' },
          { name: 'Farge', value: 'Blå' }
        ]
      }
    ]
  })

  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'M',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [{ type: 'text', text: 'M eller L i blå?' }]
        },
        {
          id: 'message-2',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: 'Hvilken størrelse, farge eller variant vil du sjekke?'
            }
          ]
        },
        {
          id: 'message-3',
          role: 'user',
          parts: [{ type: 'text', text: 'M' }]
        }
      ],
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({ fetchProducts: async () => [product] })
  )

  assert.equal(
    outcome.text,
    'Utekos TechDown i M / Blå er ikke tilgjengelig.'
  )
  assert.equal(outcome.confidence, 'high')
  assert.equal(outcome.failureCode, 'none')
})

test('shared option values never populate multiple unnamed dimensions', async () => {
  const product = createProduct({
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    variants: [
      {
        id: 'variant-blue-blue',
        title: 'Blue / Blue',
        availableForSale: true,
        selectedOptions: [
          { name: 'Hovedfarge', value: 'Blå' },
          { name: 'Detaljfarge', value: 'Blå' }
        ]
      },
      {
        id: 'variant-blue-white',
        title: 'Blue / White',
        availableForSale: false,
        selectedOptions: [
          { name: 'Hovedfarge', value: 'Blå' },
          { name: 'Detaljfarge', value: 'Hvit' }
        ]
      },
      {
        id: 'variant-black-blue',
        title: 'Black / Blue',
        availableForSale: true,
        selectedOptions: [
          { name: 'Hovedfarge', value: 'Svart' },
          { name: 'Detaljfarge', value: 'Blå' }
        ]
      }
    ]
  })

  for (const question of [
    'Blå',
    'Hovedfarge Blå',
    'Jeg vil ha blå hovedfarge, men ikke blå detaljfarge',
    'Blå hovedfarge vil jeg ikke ha, detaljfarge hvit',
    'Hovedfarge blå ønsker jeg ikke, detaljfarge hvit',
    'Hovedfarge blå eller detaljfarge hvit'
  ]) {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'stock_help',
        text: question,
        pageContext: {
          pathname: '/produkter/utekos-techdown',
          productHandle: 'utekos-techdown'
        }
      }),
      context,
      createAdapters({ fetchProducts: async () => [product] })
    )

    assert.equal(
      outcome.text,
      'Hvilken størrelse, farge eller variant vil du sjekke?',
      question
    )
    assert.equal(outcome.confidence, 'medium', question)
  }
})

test('a shared value binds to the nearest explicit option name regardless of direction', async () => {
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Detaljfarge, Blå hovedfarge',
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({
      fetchProducts: async () => [createSharedColorProduct()]
    })
  )

  assert.equal(
    outcome.text,
    'Hvilken størrelse, farge eller variant vil du sjekke?'
  )
  assert.equal(outcome.confidence, 'medium')
  assert.equal(outcome.failureCode, 'none')
  assert.deepEqual(outcome.sources, [])
})

test('explicit connector specificity outranks a closer plain postposed name', async () => {
  const questions = [
    'Hovedfarge: Blå Detaljfarge',
    'Hovedfarge = Blå Detaljfarge',
    'Hovedfarge er Blå Detaljfarge',
    'Hovedfarge ( Blå) Detaljfarge'
  ]
  const actual = []

  for (const question of questions) {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'stock_help',
        text: question,
        pageContext: {
          pathname: '/produkter/utekos-techdown',
          productHandle: 'utekos-techdown'
        }
      }),
      context,
      createAdapters({
        fetchProducts: async () => [createSharedColorProduct()]
      })
    )

    actual.push({
      confidence: outcome.confidence,
      question,
      text: outcome.text
    })
  }

  assert.deepEqual(
    actual,
    questions.map(question => ({
      confidence: 'medium',
      question,
      text: 'Hvilken størrelse, farge eller variant vil du sjekke?'
    }))
  )
})

test('explicit connector pairs keep shared values on the correct dimensions', async () => {
  const questions = [
    'Hovedfarge: Blå Detaljfarge: Hvit',
    'Hovedfarge ( Blå) Detaljfarge (Hvit)'
  ]
  const actual = []

  for (const question of questions) {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'stock_help',
        text: question,
        pageContext: {
          pathname: '/produkter/utekos-techdown',
          productHandle: 'utekos-techdown'
        }
      }),
      context,
      createAdapters({
        fetchProducts: async () => [createSharedColorProduct()]
      })
    )

    actual.push({
      confidence: outcome.confidence,
      question,
      text: outcome.text
    })
  }

  assert.deepEqual(
    actual,
    questions.map(question => ({
      confidence: 'high',
      question,
      text: 'Utekos TechDown i Blå / Hvit er ikke tilgjengelig.'
    }))
  )
})

test('a value-before-name shared option control keeps mixed availability unresolved', async () => {
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Blå hovedfarge',
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({
      fetchProducts: async () => [createSharedColorProduct()]
    })
  )

  assert.equal(
    outcome.text,
    'Hvilken størrelse, farge eller variant vil du sjekke?'
  )
  assert.equal(outcome.confidence, 'medium')
})

test('mixed-direction exact named pairs resolve the correct Shopify variant', async () => {
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Detaljfarge Hvit, Blå hovedfarge',
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({
      fetchProducts: async () => [createSharedColorProduct()]
    })
  )

  assert.equal(
    outcome.text,
    'Utekos TechDown i Blå / Hvit er ikke tilgjengelig.'
  )
  assert.equal(outcome.confidence, 'high')
  assert.equal(outcome.failureCode, 'none')
})

test('equal-proximity shared-option ties fail closed independent of catalog order', async () => {
  for (const reverseCatalogAndDimensionOrder of [false, true]) {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'stock_help',
        text: 'Detaljfarge Blå Hovedfarge',
        pageContext: {
          pathname: '/produkter/utekos-techdown',
          productHandle: 'utekos-techdown'
        }
      }),
      context,
      createAdapters({
        fetchProducts: async () => [
          createSharedColorProduct({
            reverseCatalogAndDimensionOrder,
            uniformAvailability: true
          })
        ]
      })
    )

    assert.equal(
      outcome.text,
      'Hvilken størrelse, farge eller variant vil du sjekke?',
      `reverseCatalogAndDimensionOrder=${reverseCatalogAndDimensionOrder}`
    )
    assert.equal(outcome.confidence, 'medium')
  }
})

test('explicit Shopify option names bind shared values to the named dimensions', async () => {
  const product = createProduct({
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    variants: [
      {
        id: 'variant-blue-blue',
        title: 'Blue / Blue',
        availableForSale: true,
        selectedOptions: [
          { name: 'Hovedfarge', value: 'Blå' },
          { name: 'Detaljfarge', value: 'Blå' }
        ]
      },
      {
        id: 'variant-blue-white',
        title: 'Blue / White',
        availableForSale: false,
        selectedOptions: [
          { name: 'Hovedfarge', value: 'Blå' },
          { name: 'Detaljfarge', value: 'Hvit' }
        ]
      },
      {
        id: 'variant-black-blue',
        title: 'Black / Blue',
        availableForSale: true,
        selectedOptions: [
          { name: 'Hovedfarge', value: 'Svart' },
          { name: 'Detaljfarge', value: 'Blå' }
        ]
      }
    ]
  })

  for (const question of [
    'Hovedfarge Blå og detaljfarge Hvit',
    'Hovedfarge: blå, detaljfarge: hvit'
  ]) {
    const namedPair = await answerAssistantRequest(
      createRequest({
        intent: 'stock_help',
        text: question,
        pageContext: {
          pathname: '/produkter/utekos-techdown',
          productHandle: 'utekos-techdown'
        }
      }),
      context,
      createAdapters({ fetchProducts: async () => [product] })
    )

    assert.equal(
      namedPair.text,
      'Utekos TechDown i Blå / Hvit er ikke tilgjengelig.',
      question
    )
    assert.equal(namedPair.confidence, 'high', question)
  }

  const directNamedReply = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Blå',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Er den tilgjengelig?' }]
        },
        {
          id: 'message-2',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: 'Hvilken detaljfarge vil du sjekke?'
            }
          ]
        },
        {
          id: 'message-3',
          role: 'user',
          parts: [{ type: 'text', text: 'Blå' }]
        }
      ],
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({ fetchProducts: async () => [product] })
  )

  assert.equal(
    directNamedReply.text,
    'Utekos TechDown i Blå er tilgjengelig.'
  )
  assert.equal(directNamedReply.confidence, 'high')
})

test('irrelevant historical prose cannot become a stock option choice', async () => {
  const product = createProduct({
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    variants: [
      {
        id: 'variant-m-blue',
        title: 'Medium / Blue',
        availableForSale: false,
        selectedOptions: [
          { name: 'Størrelse', value: 'M' },
          { name: 'Farge', value: 'Blå' }
        ]
      },
      {
        id: 'variant-l-blue',
        title: 'Large / Blue',
        availableForSale: true,
        selectedOptions: [
          { name: 'Størrelse', value: 'L' },
          { name: 'Farge', value: 'Blå' }
        ]
      },
      {
        id: 'variant-m-sand',
        title: 'Medium / Sand',
        availableForSale: true,
        selectedOptions: [
          { name: 'Størrelse', value: 'M' },
          { name: 'Farge', value: 'Sand' }
        ]
      },
      {
        id: 'variant-l-sand',
        title: 'Large / Sand',
        availableForSale: false,
        selectedOptions: [
          { name: 'Størrelse', value: 'L' },
          { name: 'Farge', value: 'Sand' }
        ]
      }
    ]
  })

  for (const earlierText of [
    'Jeg er 1,80 m høy. Farge kan vi sjekke senere.',
    'Jeg er 1,80 m høy, farge kan vi sjekke senere.',
    'Jeg er 1,80 m høy og vil sjekke blå farge.'
  ]) {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'stock_help',
        text: 'Er blå tilgjengelig?',
        messages: [
          {
            id: 'message-1',
            role: 'user',
            parts: [{ type: 'text', text: earlierText }]
          },
          {
            id: 'message-2',
            role: 'assistant',
            parts: [
              {
                type: 'text',
                text: 'Hvilken farge vil du sjekke?'
              }
            ]
          },
          {
            id: 'message-3',
            role: 'user',
            parts: [
              { type: 'text', text: 'Er blå tilgjengelig?' }
            ]
          }
        ],
        pageContext: {
          pathname: '/produkter/utekos-techdown',
          productHandle: 'utekos-techdown'
        }
      }),
      context,
      createAdapters({ fetchProducts: async () => [product] })
    )

    assert.equal(
      outcome.text,
      'Hvilken størrelse, farge eller variant vil du sjekke?',
      earlierText
    )
    assert.equal(outcome.confidence, 'medium', earlierText)
  }

  for (const earlierText of [
    'Jeg går mye på sand og vil sjekke størrelse senere.',
    'Jeg vil ha sand i hagen.'
  ]) {
    const terrainOutcome = await answerAssistantRequest(
      createRequest({
        intent: 'stock_help',
        text: 'M',
        messages: [
          {
            id: 'message-1',
            role: 'user',
            parts: [{ type: 'text', text: earlierText }]
          },
          {
            id: 'message-2',
            role: 'assistant',
            parts: [
              {
                type: 'text',
                text: 'Hvilken størrelse vil du sjekke?'
              }
            ]
          },
          {
            id: 'message-3',
            role: 'user',
            parts: [{ type: 'text', text: 'M' }]
          }
        ],
        pageContext: {
          pathname: '/produkter/utekos-techdown',
          productHandle: 'utekos-techdown'
        }
      }),
      context,
      createAdapters({ fetchProducts: async () => [product] })
    )

    assert.equal(
      terrainOutcome.text,
      'Hvilken størrelse, farge eller variant vil du sjekke?',
      earlierText
    )
    assert.equal(
      terrainOutcome.confidence,
      'medium',
      earlierText
    )
  }

  const verboseClarificationReply = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Jeg har sand i hagen.',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Jeg vil ha M.' }]
        },
        {
          id: 'message-2',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: 'Hvilken farge vil du sjekke?'
            }
          ]
        },
        {
          id: 'message-3',
          role: 'user',
          parts: [
            { type: 'text', text: 'Jeg har sand i hagen.' }
          ]
        }
      ],
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({ fetchProducts: async () => [product] })
  )

  assert.equal(
    verboseClarificationReply.text,
    'Hvilken størrelse, farge eller variant vil du sjekke?'
  )
  assert.equal(verboseClarificationReply.confidence, 'medium')
})

test('a bare value directly answers the bounded stock clarification safely', async () => {
  const product = createProduct({
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    variants: [
      {
        id: 'variant-m',
        title: 'Medium',
        availableForSale: false,
        selectedOptions: [{ name: 'Størrelse', value: 'M' }]
      },
      {
        id: 'variant-l',
        title: 'Large',
        availableForSale: true,
        selectedOptions: [{ name: 'Størrelse', value: 'L' }]
      }
    ]
  })

  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'M',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Er den tilgjengelig?' }]
        },
        {
          id: 'message-2',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: 'Hvilken størrelse, farge eller variant vil du sjekke?'
            }
          ]
        },
        {
          id: 'message-3',
          role: 'user',
          parts: [{ type: 'text', text: 'M' }]
        }
      ],
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({ fetchProducts: async () => [product] })
  )

  assert.equal(
    outcome.text,
    'Utekos TechDown i M er ikke tilgjengelig.'
  )
  assert.equal(outcome.confidence, 'high')
})

test('stock help asks a bounded question for an unknown or mixed variant selection', async () => {
  const product = createProduct({
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    availableForSale: true,
    variants: [
      {
        id: 'variant-m-blue',
        title: 'Medium / Blue',
        availableForSale: true,
        selectedOptions: [
          { name: 'Størrelse', value: 'M' },
          { name: 'Farge', value: 'Blå' }
        ]
      },
      {
        id: 'variant-m-black',
        title: 'Medium / Black',
        availableForSale: false,
        selectedOptions: [
          { name: 'Størrelse', value: 'M' },
          { name: 'Farge', value: 'Svart' }
        ]
      }
    ]
  })

  for (const question of [
    'Har dere størrelse XL?',
    'Har dere størrelse M?',
    'Er den tilgjengelig?'
  ]) {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'stock_help',
        text: question,
        pageContext: {
          pathname: '/produkter/utekos-techdown',
          productHandle: 'utekos-techdown'
        }
      }),
      context,
      createAdapters({ fetchProducts: async () => [product] })
    )

    assert.equal(
      outcome.text,
      'Hvilken størrelse, farge eller variant vil du sjekke?',
      question
    )
    assert.equal(outcome.confidence, 'medium', question)
    assert.equal(outcome.failureCode, 'none', question)
    assert.deepEqual(outcome.sources, [], question)
  }
})

test('malformed Shopify product results fail closed before product matching', async () => {
  let recommendationCalls = 0
  const malformedProduct = {
    ...createProduct({
      handle: 'utekos-techdown',
      title: 'Utekos TechDown'
    }),
    variants: null
  }

  const outcome = await answerAssistantRequest(
    createRequest({ text: 'Jeg skal bruke den i båt og fukt.' }),
    context,
    createAdapters({
      fetchProducts: async () =>
        [malformedProduct] as unknown as AssistantProduct[],
      commerceRecommendation: {
        recommend: async () => {
          recommendationCalls += 1
          return []
        }
      }
    })
  )

  assert.equal(recommendationCalls, 0)
  assert.equal(outcome.failureCode, 'shopify_unavailable')
  assert.equal(outcome.handoff?.reason, 'uncertain')
  assert.deepEqual(outcome.recommendations, [])
  assert.deepEqual(outcome.sources, [])
  assert.doesNotMatch(
    outcome.text,
    /TechDown|Dun|Mikrofiber|Comfyrobe|pris|lager|tilgjengelig/iu
  )
})

test('Shopify results with forbidden inventory fields fail closed before stock output', async () => {
  const product = createProduct({
    handle: 'utekos-techdown',
    title: 'Utekos TechDown'
  })
  const malformedProduct = {
    ...product,
    variants: product.variants.map(variant => ({
      ...variant,
      quantityAvailable: 17
    }))
  }

  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Er den på lager?',
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({
      fetchProducts: async () =>
        [malformedProduct] as AssistantProduct[]
    })
  )

  assert.equal(outcome.failureCode, 'shopify_unavailable')
  assert.equal(outcome.handoff?.reason, 'uncertain')
  assert.deepEqual(outcome.recommendations, [])
  assert.deepEqual(outcome.sources, [])
  assert.doesNotMatch(
    outcome.text,
    /17|TechDown|lager|tilgjengelig/iu
  )
})

test('Shopify-valid long strings remain compatible with product help', async () => {
  const longTitle =
    `Utekos TechDown ${'varm '.repeat(45)}`.trim()
  const longOptionValue = 'v'.repeat(255)
  const product = createProduct({
    id: 'product-techdown-long',
    handle: 'utekos-techdown',
    title: longTitle,
    variants: [
      {
        id: 'variant-techdown-long',
        title: 'Langt gyldig valg',
        availableForSale: true,
        selectedOptions: [
          { name: 'Tilpasning', value: longOptionValue }
        ]
      }
    ]
  })

  const outcome = await answerAssistantRequest(
    createRequest({ text: 'Jeg skal bruke den i båt og fukt.' }),
    context,
    createAdapters({ fetchProducts: async () => [product] })
  )

  assert.equal(outcome.failureCode, 'none')
  assert.equal(
    outcome.recommendations[0]?.product.title,
    longTitle
  )
  assert.equal(
    outcome.recommendations[0]?.product.variants[0]
      ?.selectedOptions[0]?.value,
    longOptionValue
  )
})

test('a long Shopify product title does not invalidate stock source output', async () => {
  const longTitle =
    `Utekos TechDown ${'produkt '.repeat(30)}`.trim()
  const product = createProduct({
    handle: 'utekos-techdown',
    title: longTitle,
    variants: [
      {
        id: 'variant-techdown-stock-long',
        title: 'Tilgjengelig valg',
        availableForSale: true,
        selectedOptions: [
          { name: 'Tilpasning', value: 'v'.repeat(255) }
        ]
      }
    ]
  })

  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'stock_help',
      text: 'Er den tilgjengelig?',
      pageContext: {
        pathname: '/produkter/utekos-techdown',
        productHandle: 'utekos-techdown'
      }
    }),
    context,
    createAdapters({ fetchProducts: async () => [product] })
  )

  assert.equal(outcome.failureCode, 'none')
  assert.equal(outcome.text, `${longTitle} er tilgjengelig.`)
  assert.equal(outcome.sources[0]?.title, 'Produktside')
  outcome.sources.forEach(source =>
    assistantSourceSchema.parse(source)
  )
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

test('support answers remove markdown markers before streaming to the UI', async () => {
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'shipping_returns',
      text: 'Hva koster frakten?'
    }),
    context,
    createAdapters({
      supportKnowledge: {
        async answer() {
          return {
            confidence: 'high',
            sources: [
              {
                title: 'Frakt og retur',
                url: 'https://utekos.no/frakt-og-retur'
              }
            ],
            text: '**Fraktkostnader**\nFri frakt over 999 kr.'
          }
        }
      }
    })
  )

  assert.equal(
    outcome.text,
    'Fraktkostnader\nFri frakt over 999 kr.'
  )
  assert.doesNotMatch(outcome.text, /\*\*/u)
})

test('shipping FAQ distinguishes delivery duration from the return window', async () => {
  const deliveryAnswer =
    'Leveringstiden er normalt 2-5 virkedager. Bestillinger som gjøres før klokken 16 sendes samme dag, med unntak av søndag.'
  const returnWindowAnswer =
    'Vi opererer med lovbestemt 14 dagers angrerett fra dagen kunden mottar produktet. Fraktkostnader knyttet til retur betales av sender.'

  for (const question of [
    'Hvor lenge er leveringstiden?',
    'Hvor lang tid tar frakten?',
    'Når kan jeg forvente pakken?'
  ]) {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'shipping_returns',
        text: question
      }),
      context,
      createAdapters()
    )

    assert.equal(outcome.text, deliveryAnswer, question)
    assert.doesNotMatch(outcome.text, /14 dagers angrerett/iu)
  }

  for (const question of [
    'Hvor lenge har jeg angrerett?',
    'Hvor lang er angreretten?',
    'Hvor lenge kan jeg returnere varen?',
    'Hvor lenge kan jeg sende varen tilbake?',
    'Kan jeg fortsatt returnere etter 14 dager?',
    'Hvor mange dager har jeg på å returnere?',
    'Hvor lang tid har jeg på å sende varen i retur?',
    'Når må jeg senest sende varen tilbake?'
  ]) {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'shipping_returns',
        text: question
      }),
      context,
      createAdapters()
    )

    assert.equal(outcome.text, returnWindowAnswer, question)
    assert.doesNotMatch(outcome.text, /2-5 virkedager/iu)
  }
})

test('shipping FAQ preserves explicit return-process routing', async () => {
  for (const question of [
    'Hvordan returnerer jeg en vare?',
    'Hvordan sendes returen?'
  ]) {
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'shipping_returns',
        text: question
      }),
      context,
      createAdapters()
    )

    assert.equal(
      outcome.text,
      'Send en e-post til kundeservice@utekos.no med fullt navn, adresse, ordrenummer og hvilke produkter returen gjelder. Pakk varen forsvarlig og bruk en sendingsmetode med sporing.',
      question
    )
  }
})

test('shipping intent canonicalizes mixed size wording to the return process', async () => {
  const calls: string[] = []
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'shipping_returns',
      text: 'Hvordan returnerer jeg varen fordi størrelsen er feil?'
    }),
    context,
    createAdapters({
      supportKnowledge: {
        answer: async input => {
          calls.push(input.question)
          return staticSupportKnowledgeAdapter.answer(input)
        }
      }
    })
  )

  assert.deepEqual(calls, ['Hvordan returnerer jeg en vare?'])
  assert.equal(
    outcome.text,
    'Send en e-post til kundeservice@utekos.no med fullt navn, adresse, ordrenummer og hvilke produkter returen gjelder. Pakk varen forsvarlig og bruk en sendingsmetode med sporing.'
  )
  assert.deepEqual(outcome.sources, [
    {
      title: 'Frakt og retur',
      url: 'https://utekos.no/frakt-og-retur'
    }
  ])
})

test('size intent starts the grounded local guide without a knowledge call', async () => {
  const calls: string[] = []
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'size_help',
      text: 'Hvilken størrelse gjelder når frakten returneres?'
    }),
    context,
    createAdapters({
      supportKnowledge: {
        answer: async input => {
          calls.push(input.question)
          return staticSupportKnowledgeAdapter.answer(input)
        }
      }
    })
  )

  assert.deepEqual(calls, [])
  assert.match(outcome.text, /Hvilket produkt/iu)
  assert.equal(
    outcome.sources[0]?.url,
    'https://utekos.no/handlehjelp/storrelsesguide'
  )
})

test('shipping classifier pairs return subtopics and forwards canonical FAQ questions', async () => {
  const cases = [
    {
      question: 'Er det unntak fra fri frakt?',
      canonicalQuestion: 'Hva koster frakten hos Utekos?',
      answerPattern: /fraktkostnad på 99 kr/iu,
      excludedPattern: /hygieniske årsaker/iu
    },
    {
      question: 'Hvordan returnerer jeg under angreretten?',
      canonicalQuestion: 'Hvordan returnerer jeg en vare?',
      answerPattern: /kundeservice@utekos\.no/iu,
      excludedPattern: /14 dagers angrerett/iu
    },
    {
      question: 'Hva koster det å returnere varen?',
      canonicalQuestion: 'Hvor lang er angreretten?',
      answerPattern: /retur betales av sender/iu,
      excludedPattern: /fraktkostnad på 99 kr/iu
    }
  ] as const

  for (const {
    question,
    canonicalQuestion,
    answerPattern,
    excludedPattern
  } of cases) {
    const calls: string[] = []
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'shipping_returns',
        text: question
      }),
      context,
      createAdapters({
        supportKnowledge: {
          answer: async input => {
            calls.push(input.question)
            return staticSupportKnowledgeAdapter.answer(input)
          }
        }
      })
    )

    assert.deepEqual(calls, [canonicalQuestion], question)
    assert.match(outcome.text, answerPattern, question)
    assert.doesNotMatch(outcome.text, excludedPattern, question)
  }
})

test('ambiguous shipping intent uses one grounded overview instead of shipping cost', async () => {
  const calls: string[] = []
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'shipping_returns',
      text: 'Kan dere forklare frakt og retur?'
    }),
    context,
    createAdapters({
      supportKnowledge: {
        answer: async input => {
          calls.push(input.question)
          return staticSupportKnowledgeAdapter.answer(input)
        }
      }
    })
  )

  assert.deepEqual(calls, [
    'Gi en oversikt over frakt og retur hos Utekos.'
  ])
  assert.equal(outcome.failureCode, 'none')
  assert.equal(outcome.confidence, 'high')
  assert.equal(
    outcome.sources[0]?.url,
    'https://utekos.no/frakt-og-retur'
  )
  for (const faqItem of shippingReturnsFaqItems) {
    assert.ok(outcome.text.includes(faqItem.answer))
  }
})

test('a shipping-method question does not trigger return-process or delivery claims', async () => {
  const calls: string[] = []
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'shipping_returns',
      text: 'Hvordan sender dere pakken?'
    }),
    context,
    createAdapters({
      supportKnowledge: {
        answer: async input => {
          calls.push(input.question)
          return staticSupportKnowledgeAdapter.answer(input)
        }
      }
    })
  )

  assert.deepEqual(calls, [
    'Gi en oversikt over frakt og retur hos Utekos.'
  ])
  assert.equal(outcome.failureCode, 'none')
  assert.equal(
    outcome.sources[0]?.url,
    'https://utekos.no/frakt-og-retur'
  )
  for (const faqItem of shippingReturnsFaqItems) {
    assert.ok(outcome.text.includes(faqItem.answer))
  }
})

test('size help uses follow-up answers and never promises fit', async () => {
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'size_help',
      text: 'Jeg er 176 cm og ønsker tettere passform.',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [
            { type: 'text', text: 'Det gjelder TechDown.' }
          ]
        },
        {
          id: 'message-2',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: 'Hvor høy er du, og hvilken passform ønsker du?'
            }
          ]
        },
        {
          id: 'message-3',
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Jeg er 176 cm og ønsker tettere passform.'
            }
          ]
        }
      ]
    }),
    context,
    createAdapters()
  )

  assert.match(outcome.text, /sammenlign målene/iu)
  assert.match(outcome.text, /Medium \(M\)/u)
  assert.match(outcome.text, /ikke en garanti/iu)
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

test('explicit support intents keep size local and shipping grounded', async () => {
  const calls: string[] = []
  const supportKnowledge: AssistantAdapters['supportKnowledge'] =
    {
      answer: async input => {
        calls.push(input.question)
        return staticSupportKnowledgeAdapter.answer(input)
      }
    }

  const sizeOutcome = await answerAssistantRequest(
    createRequest({
      intent: 'size_help',
      text: 'Hvilken passer meg best?'
    }),
    context,
    createAdapters({ supportKnowledge })
  )

  assert.deepEqual(calls, [])
  assert.equal(sizeOutcome.failureCode, 'none')
  assert.match(sizeOutcome.text, /Hvilket produkt/iu)
  assert.equal(
    sizeOutcome.sources[0]?.url,
    'https://utekos.no/handlehjelp/storrelsesguide'
  )

  calls.length = 0
  const shippingOutcome = await answerAssistantRequest(
    createRequest({
      intent: 'shipping_returns',
      text: 'Kan dere hjelpe meg?'
    }),
    context,
    createAdapters({ supportKnowledge })
  )

  assert.deepEqual(calls, [
    'Gi en oversikt over frakt og retur hos Utekos.'
  ])
  assert.equal(shippingOutcome.failureCode, 'none')
  assert.equal(
    shippingOutcome.sources[0]?.url,
    'https://utekos.no/frakt-og-retur'
  )
  for (const faqItem of shippingReturnsFaqItems) {
    assert.ok(shippingOutcome.text.includes(faqItem.answer))
  }
})

test('vague shipping intent still maps a knowledge failure safely with one call', async () => {
  let knowledgeCalls = 0
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'shipping_returns',
      text: 'Kan dere hjelpe meg?'
    }),
    context,
    createAdapters({
      supportKnowledge: {
        answer: async () => {
          knowledgeCalls += 1
          throw new Error(
            'customer text and unsafe provider detail'
          )
        }
      }
    })
  )

  assert.equal(knowledgeCalls, 1)
  assert.equal(outcome.failureCode, 'knowledge_unavailable')
  assert.equal(outcome.handoff?.reason, 'uncertain')
  assert.deepEqual(outcome.sources, [])
  assert.equal(
    outcome.text,
    'Jeg fikk ikke hentet et sikkert svar. Kundeservice kan hjelpe deg videre.'
  )
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

test('explicit human support request returns contact handoff without querying providers', async () => {
  let providerCalls = 0
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'other',
      text: 'Jeg vil snakke med kundeservice.'
    }),
    context,
    createAdapters({
      supportKnowledge: {
        answer: async () => {
          providerCalls += 1
          return {
            text: 'Skal ikke brukes',
            confidence: 'high',
            sources: []
          }
        }
      }
    })
  )

  assert.equal(providerCalls, 0)
  assert.equal(outcome.handoff?.reason, 'uncertain')
  assert.equal(outcome.handoff?.contactPath, '/kontaktskjema')
  assert.equal(outcome.handoff?.email, 'kundeservice@utekos.no')
  assert.equal(outcome.handoff?.phone, '+4740216343')
  assert.equal(outcome.failureCode, 'none')
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
    assert.deepEqual(logged, [
      [
        'customer_assistant_support_knowledge_failure',
        { code: 'unknown' }
      ]
    ])
    assert.equal(
      logged.some(values =>
        values.join(' ').includes('Når kommer pakken?')
      ),
      false
    )
    assert.equal(
      logged.some(values =>
        values.join(' ').includes('provider detail')
      ),
      false
    )
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
  assert.equal(outcome.text, useQuestion)
  assert.equal(outcome.failureCode, 'none')
  assert.equal(outcome.handoff, null)
})

test('completes the full clarification flow using all user turns', async () => {
  const products = [
    createProduct({
      id: 'product-dun',
      handle: 'utekos-dun',
      title: 'Utekos Dun'
    })
  ]
  let providerCalls = 0
  const adapters = createAdapters({
    fetchProducts: async () => {
      providerCalls += 1
      return products
    },
    commerceRecommendation: {
      recommend: async () => {
        providerCalls += 1
        return []
      }
    }
  })

  const first = await answerAssistantRequest(
    createRequest({ text: 'Jeg trenger hjelp til å velge.' }),
    context,
    adapters
  )
  assert.equal(first.text, useQuestion)
  assert.equal(providerCalls, 0)

  const secondMessages = [
    ...createRequest({ text: 'Jeg trenger hjelp til å velge.' })
      .messages,
    {
      id: 'assistant-use',
      role: 'assistant' as const,
      parts: [{ type: 'text' as const, text: useQuestion }]
    },
    {
      id: 'user-use',
      role: 'user' as const,
      parts: [{ type: 'text' as const, text: 'På hytta.' }]
    }
  ]
  const second = await answerAssistantRequest(
    createRequest({
      text: 'På hytta.',
      messages: secondMessages
    }),
    context,
    adapters
  )
  assert.equal(second.text, priorityQuestion)
  assert.equal(providerCalls, 0)

  const third = await answerAssistantRequest(
    createRequest({
      text: 'Mest mulig varme.',
      messages: [
        ...secondMessages,
        {
          id: 'assistant-priority',
          role: 'assistant',
          parts: [{ type: 'text', text: priorityQuestion }]
        },
        {
          id: 'user-priority',
          role: 'user',
          parts: [{ type: 'text', text: 'Mest mulig varme.' }]
        }
      ]
    }),
    context,
    adapters
  )

  assert.equal(third.confidence, 'high')
  assert.equal(third.failureCode, 'none')
  assert.equal(third.handoff, null)
  assert.equal(
    third.recommendations[0]?.product.handle,
    'utekos-dun'
  )
  assert.equal(providerCalls, 2)
})

test('three exhausted clarifications produce a low-confidence uncertain handoff without providers', async () => {
  let providerCalls = 0
  const outcome = await answerAssistantRequest(
    createRequest({
      text: 'Det er alt.',
      messages: [
        {
          id: 'user-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Jeg trenger hjelp.' }]
        },
        {
          id: 'assistant-1',
          role: 'assistant',
          parts: [{ type: 'text', text: useQuestion }]
        },
        {
          id: 'user-2',
          role: 'user',
          parts: [{ type: 'text', text: 'I båten.' }]
        },
        {
          id: 'assistant-2',
          role: 'assistant',
          parts: [{ type: 'text', text: priorityQuestion }]
        },
        {
          id: 'user-3',
          role: 'user',
          parts: [{ type: 'text', text: 'Lav vekt.' }]
        },
        {
          id: 'assistant-3',
          role: 'assistant',
          parts: [{ type: 'text', text: useQuestion }]
        },
        {
          id: 'user-4',
          role: 'user',
          parts: [{ type: 'text', text: 'Det er alt.' }]
        }
      ]
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
  assert.equal(outcome.confidence, 'low')
  assert.equal(outcome.handoff?.reason, 'uncertain')
  assert.deepEqual(outcome.recommendations, [])
})

test('restricted text never reaches Shopify, knowledge, or recommendation adapters', async () => {
  const cases = [
    ['other', 'kunde@example.no', 'personal_data'],
    ['other', '+47 400 00 000', 'personal_data'],
    ['other', '4111 1111 1111 1111', 'personal_data'],
    ['shipping_returns', 'Bestillingen min mangler', 'order'],
    ['shipping_returns', 'Pakken har ikke kommet', 'order'],
    ['product_help', '#12345', 'order'],
    ['other', 'UTE-12345', 'order'],
    ['other', 'Kortet blir avvist', 'payment'],
    ['product_help', 'Plagget er skadet', 'complaint'],
    ['product_help', 'Varen er ødelagt', 'complaint'],
    ['product_help', 'Varen er defekt', 'complaint']
  ] as const

  for (const [intent, text, reason] of cases) {
    let providerCalls = 0
    const outcome = await answerAssistantRequest(
      createRequest({ intent, text }),
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

    assert.equal(providerCalls, 0, text)
    assert.equal(outcome.handoff?.reason, reason, text)
    assert.deepEqual(outcome.recommendations, [], text)
    assert.deepEqual(outcome.sources, [], text)
  }
})

test('product labels never cross user-turn boundaries for restricted candidates', async () => {
  const product = createProduct({
    id: 'product-techdown',
    handle: 'utekos-techdown',
    title: 'Utekos TechDown'
  })
  const cases = [
    {
      earlier: 'Jeg skal i båt og fukt. SKU',
      later: '#12345',
      reason: 'order'
    },
    {
      earlier: '#12345',
      later: 'SKU. Jeg skal i båt og fukt.',
      reason: 'order'
    },
    {
      earlier: 'Jeg skal i båt og fukt. Varenummer',
      later: '400 00 000',
      reason: 'personal_data'
    },
    {
      earlier: '400 00 000',
      later: 'Varenummer. Jeg skal i båt og fukt.',
      reason: 'personal_data'
    },
    {
      earlier: 'Jeg skal i båt og fukt. Produktnummer',
      later: '4111 1111 1111 1111',
      reason: 'personal_data'
    },
    {
      earlier: '4111 1111 1111 1111',
      later: 'Produktnummer. Jeg skal i båt og fukt.',
      reason: 'personal_data'
    }
  ] as const

  for (const { earlier, later, reason } of cases) {
    const { adapters, calls } = createObservedAdapters([product])
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'product_help',
        text: later,
        messages: [
          {
            id: 'message-1',
            role: 'user',
            parts: [{ type: 'text', text: earlier }]
          },
          {
            id: 'message-2',
            role: 'assistant',
            parts: [
              { type: 'text', text: 'Hvordan kan jeg hjelpe?' }
            ]
          },
          {
            id: 'message-3',
            role: 'user',
            parts: [{ type: 'text', text: later }]
          }
        ]
      }),
      context,
      adapters
    )

    assert.deepEqual(
      calls,
      { shopify: 0, knowledge: 0, recommendation: 0 },
      `${earlier} / ${later}`
    )
    assert.equal(
      outcome.handoff?.reason,
      reason,
      `${earlier} / ${later}`
    )
    assert.deepEqual(outcome.recommendations, [])
    assert.deepEqual(outcome.sources, [])
  }
})

test('compact Norwegian E.164 numbers never reach any adapter', async () => {
  const product = createProduct({
    id: 'product-techdown',
    handle: 'utekos-techdown',
    title: 'Utekos TechDown'
  })

  for (const phone of [
    '+4740000000',
    '+4740216343',
    '004740000000',
    '004740216343'
  ]) {
    const { adapters, calls } = createObservedAdapters([product])
    const outcome = await answerAssistantRequest(
      createRequest({
        intent: 'product_help',
        text: `Jeg skal i båt og fukt. ${phone}`
      }),
      context,
      adapters
    )

    assert.deepEqual(
      calls,
      { shopify: 0, knowledge: 0, recommendation: 0 },
      phone
    )
    assert.equal(outcome.handoff?.reason, 'personal_data', phone)
    assert.deepEqual(outcome.recommendations, [], phone)
    assert.deepEqual(outcome.sources, [], phone)
  }
})

test('a restricted token in an earlier user turn never reaches adapters', async () => {
  let providerCalls = 0
  const outcome = await answerAssistantRequest(
    createRequest({
      intent: 'product_help',
      text: 'Hvilken modell passer til båt?',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [{ type: 'text', text: 'UTE-12345' }]
        },
        {
          id: 'message-2',
          role: 'assistant',
          parts: [
            { type: 'text', text: 'Hvordan kan jeg hjelpe?' }
          ]
        },
        {
          id: 'message-3',
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Hvilken modell passer til båt?'
            }
          ]
        }
      ]
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
  assert.deepEqual(outcome.recommendations, [])
  assert.deepEqual(outcome.sources, [])
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
