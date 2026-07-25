import assert from 'node:assert/strict'
import test from 'node:test'
import {
  staticCommerceRecommendationAdapter,
  type AssistantAdapters,
  type SupportKnowledgeAdapter,
  type SupportKnowledgeResult
} from '@/lib/customer-assistant/server/assistantAdapters'
import type { AssistantOutcome } from '@/lib/customer-assistant/server/answerAssistantRequest'
import { fetchAssistantProducts } from '@/lib/customer-assistant/server/shopifyAssistantCatalog'
import {
  createCustomerAssistantAnswer,
  type CustomerAssistantAnswerDependencies
} from '@/app/api/customer-assistant/chat/route'
import {
  DiscoverySupportKnowledge,
  DiscoverySupportKnowledgeConfigurationError,
  type DiscoverySupportKnowledgeDependencies
} from './discoverySupportKnowledge'
import { buildAssistantKnowledgeDocuments } from './knowledgeManifest'

const validEnvironment = {
  GCP_DISCOVERY_ENGINE_ID: 'utekos-customer-assistant-v1',
  GCP_PROJECT_ID: 'utekos-production'
} as const

const approvedAnswer = {
  answer: {
    answerText: 'Godkjent, dokumentert svar.',
    groundingScore: 0.99,
    references: [
      {
        unstructuredDocumentInfo: {
          uri: 'https://utekos.no/frakt-og-retur'
        }
      }
    ]
  }
}

function createAdapterHarness({
  environment = validEnvironment,
  response = approvedAnswer
}: {
  environment?: Readonly<Record<string, string | undefined>>
  response?: unknown
} = {}) {
  let clientConstructionCount = 0
  let clientOptions: unknown
  const calls: Array<{ request: unknown; options: unknown }> = []

  const dependencies: DiscoverySupportKnowledgeDependencies = {
    buildKnowledgeDocuments: buildAssistantKnowledgeDocuments,
    createClient: options => {
      clientConstructionCount += 1
      clientOptions = options

      return {
        async answerQuery(request, options) {
          calls.push({ request, options })

          return [response as never, undefined, undefined]
        }
      }
    },
    createGoogleCloudClientOptions: () => undefined
  }

  const adapter = new DiscoverySupportKnowledge(
    environment,
    dependencies
  )

  return {
    adapter,
    calls,
    get clientConstructionCount() {
      return clientConstructionCount
    },
    get clientOptions() {
      return clientOptions
    }
  }
}

test('defaults to global and uses the global Discovery endpoint', async () => {
  const harness = createAdapterHarness()

  assert.equal(harness.clientConstructionCount, 0)
  await harness.adapter.answer({
    productHandle: null,
    question: 'Hva koster frakt?'
  })

  assert.equal(harness.clientConstructionCount, 1)
  assert.deepEqual(harness.clientOptions, {
    apiEndpoint: 'discoveryengine.googleapis.com'
  })
})

for (const location of ['us', 'eu'] as const) {
  test(`accepts ${location} and uses its regional endpoint`, async () => {
    const harness = createAdapterHarness({
      environment: {
        ...validEnvironment,
        GCP_DISCOVERY_LOCATION: location
      }
    })

    await harness.adapter.answer({
      productHandle: null,
      question: 'Hva koster frakt?'
    })

    assert.deepEqual(harness.clientOptions, {
      apiEndpoint: `${location}-discoveryengine.googleapis.com`
    })
  })
}

test('uses the fixed serving config, automatic session and exact safe request', async () => {
  const harness = createAdapterHarness()

  await harness.adapter.answer({
    productHandle: null,
    question: 'Hva koster frakt?'
  })

  assert.deepEqual(harness.calls, [
    {
      request: {
        answerGenerationSpec: {
          ignoreAdversarialQuery: true,
          ignoreJailBreakingQuery: true,
          ignoreLowRelevantContent: true,
          ignoreNonAnswerSeekingQuery: true,
          includeCitations: true
        },
        query: { text: 'Hva koster frakt?' },
        safetySpec: { enable: true },
        servingConfig:
          'projects/utekos-production/locations/global/collections/default_collection/engines/utekos-customer-assistant-v1/servingConfigs/default_serving_config',
        session:
          'projects/utekos-production/locations/global/collections/default_collection/engines/utekos-customer-assistant-v1/sessions/-'
      },
      options: { timeout: 8_000 }
    }
  ])
})

test('missing or invalid configuration fails closed before client construction', () => {
  for (const environment of [
    {},
    { GCP_PROJECT_ID: 'utekos-production' },
    { GCP_DISCOVERY_ENGINE_ID: 'utekos-customer-assistant-v1' },
    {
      ...validEnvironment,
      GCP_DISCOVERY_LOCATION: 'europe-west1'
    }
  ]) {
    let clientConstructionCount = 0

    assert.throws(
      () =>
        new DiscoverySupportKnowledge(environment, {
          buildKnowledgeDocuments: () => [],
          createClient: () => {
            clientConstructionCount += 1
            throw new Error('unexpected_client_construction')
          },
          createGoogleCloudClientOptions: () => undefined
        }),
      error => {
        assert.ok(
          error instanceof
            DiscoverySupportKnowledgeConfigurationError
        )
        assert.equal(error.code, 'gcp_discovery_not_configured')
        assert.equal(
          error.message,
          'gcp_discovery_not_configured'
        )
        return true
      }
    )
    assert.equal(clientConstructionCount, 0)
  }
})

test('normalizes approved unstructured, structured and chunk references', async () => {
  const harness = createAdapterHarness({
    response: {
      answer: {
        answerText: 'Svar fra godkjente kilder.',
        groundingScore: 0.99,
        references: [
          {
            unstructuredDocumentInfo: {
              title: 'Leverandørtittel skal ikke brukes',
              uri: 'https://utekos.no/frakt-og-retur'
            }
          },
          {
            structuredDocumentInfo: {
              title: 'Feil tittel',
              uri: 'https://utekos.no/handlehjelp/storrelsesguide'
            }
          },
          {
            chunkInfo: {
              documentMetadata: {
                title: 'Feil tittel',
                uri: 'https://utekos.no/kontaktskjema'
              }
            }
          }
        ]
      }
    }
  })

  const result = await harness.adapter.answer({
    productHandle: null,
    question: 'Kan dere hjelpe?'
  })

  assert.deepEqual(result, {
    confidence: 'medium',
    sources: [
      {
        title: 'Frakt og retur',
        url: 'https://utekos.no/frakt-og-retur'
      },
      {
        title: 'Størrelsesguide',
        url: 'https://utekos.no/handlehjelp/storrelsesguide'
      },
      {
        title: 'Kontakt Utekos kundeservice',
        url: 'https://utekos.no/kontaktskjema'
      }
    ],
    text: 'Svar fra godkjente kilder.'
  })
})

test('filters foreign, same-origin unreviewed, malformed and duplicate references', async () => {
  const harness = createAdapterHarness({
    response: {
      answer: {
        answerText: 'Svar med bare én godkjent kilde.',
        references: [
          {
            unstructuredDocumentInfo: {
              uri: 'https://example.com/frakt-og-retur'
            }
          },
          {
            structuredDocumentInfo: {
              uri: 'https://utekos.no/produkter/utekos-dun'
            }
          },
          {
            chunkInfo: {
              documentMetadata: { uri: 'ikke-en-url' }
            }
          },
          { unstructuredDocumentInfo: { uri: null } },
          {
            unstructuredDocumentInfo: {
              uri: 'https://utekos.no/frakt-og-retur'
            }
          },
          {
            structuredDocumentInfo: {
              uri: 'https://utekos.no/frakt-og-retur'
            }
          }
        ]
      }
    }
  })

  const result = await harness.adapter.answer({
    productHandle: null,
    question: 'Hva koster frakt?'
  })

  assert.deepEqual(result.sources, [
    {
      title: 'Frakt og retur',
      url: 'https://utekos.no/frakt-og-retur'
    }
  ])
  assert.equal(result.confidence, 'medium')
})

test('rejects malformed protobuf oneof references with mixed approved and unapproved members', async () => {
  const malformedReference = {
    structuredDocumentInfo: {
      uri: 'https://utekos.no/produkter/utekos-dun'
    },
    unstructuredDocumentInfo: {
      uri: 'https://utekos.no/frakt-og-retur'
    }
  }
  const harnessWithValidReference = createAdapterHarness({
    response: {
      answer: {
        answerText: 'Svar med én gyldig referanse.',
        references: [
          malformedReference,
          {
            chunkInfo: {
              documentMetadata: {
                uri: 'https://utekos.no/handlehjelp/vask-og-vedlikehold'
              }
            }
          }
        ]
      }
    }
  })

  const groundedResult =
    await harnessWithValidReference.adapter.answer({
      productHandle: null,
      question: 'Hvordan vasker jeg produktet?'
    })

  assert.deepEqual(groundedResult.sources, [
    {
      title: 'Vask og vedlikehold',
      url: 'https://utekos.no/handlehjelp/vask-og-vedlikehold'
    }
  ])

  const harnessWithOnlyMalformedReference = createAdapterHarness(
    {
      response: {
        answer: {
          answerText: 'Svar som ikke skal brukes.',
          references: [malformedReference]
        }
      }
    }
  )

  assert.deepEqual(
    await harnessWithOnlyMalformedReference.adapter.answer({
      productHandle: null,
      question: 'Hva koster frakt?'
    }),
    safeNoAnswer
  )
})

test('caps approved sources at five in provider order', async () => {
  const approvedUrls = [
    'https://utekos.no/handlehjelp/sammenlign-modeller',
    'https://utekos.no/comfyrobe',
    'https://utekos.no/frakt-og-retur',
    'https://utekos.no/handlehjelp/storrelsesguide',
    'https://utekos.no/handlehjelp/teknologi-materialer',
    'https://utekos.no/handlehjelp/vask-og-vedlikehold',
    'https://utekos.no/kontaktskjema'
  ]
  const harness = createAdapterHarness({
    response: {
      answer: {
        answerText: 'Svar med mange kilder.',
        references: approvedUrls.map(uri => ({
          unstructuredDocumentInfo: { uri }
        }))
      }
    }
  })

  const result = await harness.adapter.answer({
    productHandle: null,
    question: 'Fortell mer.'
  })

  assert.deepEqual(
    result.sources.map(source => source.url),
    approvedUrls.slice(0, 5)
  )
})

const safeNoAnswer: SupportKnowledgeResult = {
  confidence: 'low',
  sources: [],
  text: 'Jeg fant ikke et sikkert svar i det godkjente Utekos-innholdet.'
}

test('withholds answers without an exact approved reference', async () => {
  const harness = createAdapterHarness({
    response: {
      answer: {
        answerText: 'Uforankret svar.',
        references: [
          {
            unstructuredDocumentInfo: {
              uri: 'https://utekos.no/produkter/utekos-dun'
            }
          }
        ]
      }
    }
  })

  assert.deepEqual(
    await harness.adapter.answer({
      productHandle: null,
      question: 'Hva anbefaler dere?'
    }),
    safeNoAnswer
  )
})

test('withholds answers for every provider skip reason', async () => {
  for (const skipReason of [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    'POTENTIAL_FUTURE_SKIP_REASON'
  ]) {
    const harness = createAdapterHarness({
      response: {
        answer: {
          ...approvedAnswer.answer,
          answerSkippedReasons: [skipReason]
        }
      }
    })

    assert.deepEqual(
      await harness.adapter.answer({
        productHandle: null,
        question: 'Hva koster frakt?'
      }),
      safeNoAnswer
    )
  }
})

test('withholds blank, oversized, malformed and safety-blocked answers', async () => {
  for (const response of [
    null,
    {},
    { answer: null },
    { answer: { answerText: '   ', references: [] } },
    {
      answer: {
        ...approvedAnswer.answer,
        answerText: 'x'.repeat(2_001)
      }
    },
    {
      answer: {
        ...approvedAnswer.answer,
        safetyRatings: [{ blocked: true }]
      }
    },
    {
      answer: {
        ...approvedAnswer.answer,
        references: 'not-an-array'
      }
    }
  ]) {
    const harness = createAdapterHarness({ response })

    assert.deepEqual(
      await harness.adapter.answer({
        productHandle: null,
        question: 'Hva koster frakt?'
      }),
      safeNoAnswer
    )
  }
})

test('never logs the raw customer question', async () => {
  const rawQuestion = 'HEMMELIG SPØRSMÅL FRA KUNDEN'
  const observed: string[] = []
  const originalConsole = {
    debug: console.debug,
    error: console.error,
    info: console.info,
    log: console.log,
    warn: console.warn
  }

  for (const method of Object.keys(originalConsole) as Array<
    keyof typeof originalConsole
  >) {
    console[method] = (...values: unknown[]) => {
      observed.push(values.map(String).join(' '))
    }
  }

  try {
    await createAdapterHarness().adapter.answer({
      productHandle: null,
      question: rawQuestion
    })
  } finally {
    Object.assign(console, originalConsole)
  }

  assert.equal(
    observed.some(entry => entry.includes(rawQuestion)),
    false
  )
})

const stubOutcome: AssistantOutcome = {
  confidence: 'low',
  failureCode: 'no_grounded_answer',
  handoff: null,
  recommendations: [],
  sources: [],
  text: 'stub'
}

function createRouteDependencies() {
  let createCount = 0
  let capturedAdapters: AssistantAdapters | undefined
  const supportKnowledge: SupportKnowledgeAdapter = {
    async answer() {
      return safeNoAnswer
    }
  }
  const answer = (async (_request, _context, adapters) => {
    capturedAdapters = adapters
    return stubOutcome
  }) as CustomerAssistantAnswerDependencies['answer']
  const dependencies: CustomerAssistantAnswerDependencies = {
    answer,
    createSupportKnowledge: () => {
      createCount += 1
      return supportKnowledge
    }
  }

  return {
    answer,
    dependencies,
    get capturedAdapters() {
      return capturedAdapters
    },
    get createCount() {
      return createCount
    },
    supportKnowledge
  }
}

test('route preserves the default answer path when Discovery config is absent or invalid', () => {
  for (const environment of [
    {},
    { GCP_PROJECT_ID: 'utekos-production' },
    {
      ...validEnvironment,
      GCP_DISCOVERY_LOCATION: 'europe-west1'
    }
  ]) {
    const harness = createRouteDependencies()

    assert.equal(
      createCustomerAssistantAnswer(
        environment,
        harness.dependencies
      ),
      harness.answer
    )
    assert.equal(harness.createCount, 0)
  }
})

test('route replaces only support knowledge when Discovery config is valid', async () => {
  const harness = createRouteDependencies()
  const answer = createCustomerAssistantAnswer(
    validEnvironment,
    harness.dependencies
  )

  assert.notEqual(answer, harness.answer)
  assert.equal(harness.createCount, 1)

  await answer({} as never, {} as never)

  assert.equal(
    harness.capturedAdapters?.fetchProducts,
    fetchAssistantProducts
  )
  assert.equal(
    harness.capturedAdapters?.commerceRecommendation,
    staticCommerceRecommendationAdapter
  )
  assert.equal(
    harness.capturedAdapters?.supportKnowledge,
    harness.supportKnowledge
  )
})
