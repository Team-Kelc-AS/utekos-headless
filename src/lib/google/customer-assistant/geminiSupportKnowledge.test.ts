import assert from 'node:assert/strict'
import test from 'node:test'
import type { BaseExternalAccountClient } from 'google-auth-library'
import {
  CUSTOMER_ASSISTANT_GEMINI_LOCATION,
  CUSTOMER_ASSISTANT_GEMINI_MODEL,
  GeminiSupportKnowledge,
  GeminiSupportKnowledgeConfigurationError,
  GeminiSupportKnowledgeProviderError,
  readGeminiSupportKnowledgeConfig,
  type GeminiSupportKnowledgeDependencies
} from './geminiSupportKnowledge'
import { buildAssistantKnowledgeDocuments } from './knowledgeManifest'

const validEnvironment = {
  GCP_PROJECT_ID: 'utekos-production'
} as const

const approvedDocuments = buildAssistantKnowledgeDocuments()
const approvedSourceUrl = 'https://utekos.no/frakt-og-retur'

function generateContentWithText(
  text: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    candidates: [
      {
        content: { parts: [{ text }], role: 'model' },
        finishReason: 'STOP'
      }
    ],
    modelVersion: CUSTOMER_ASSISTANT_GEMINI_MODEL,
    ...overrides
  }
}

const approvedAnswer = generateContentWithText(
  JSON.stringify({
    answer: 'Fri frakt gjelder over 999 kr.',
    answerable: true,
    source_urls: [approvedSourceUrl]
  })
)
const safeNoAnswer = {
  confidence: 'low',
  sources: [],
  text: 'Jeg fant ikke et sikkert svar i det godkjente Utekos-innholdet.'
} as const

function createAdapterHarness({
  environment = validEnvironment,
  googleCloudOptions,
  response = approvedAnswer
}: {
  environment?: Readonly<Record<string, string | undefined>>
  googleCloudOptions?: {
    authClient: BaseExternalAccountClient
    projectId: string
  }
  response?: unknown
} = {}) {
  let clientConstructionCount = 0
  let clientOptions: unknown
  let observedAuthEnvironment: unknown
  const calls: Array<{ request: unknown; options: unknown }> = []

  const dependencies: GeminiSupportKnowledgeDependencies = {
    buildKnowledgeDocuments: buildAssistantKnowledgeDocuments,
    createClient: options => {
      clientConstructionCount += 1
      clientOptions = options

      return {
        async create(request, options) {
          calls.push({ request, options })
          return response
        }
      }
    },
    createGoogleCloudClientOptions: environment => {
      observedAuthEnvironment = environment
      return googleCloudOptions
    }
  }
  const adapter = new GeminiSupportKnowledge(
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
    },
    get observedAuthEnvironment() {
      return observedAuthEnvironment
    }
  }
}

test('uses the exact Gemini 3.6 Flash model in global through v1 configuration', () => {
  assert.deepEqual(
    readGeminiSupportKnowledgeConfig(validEnvironment),
    {
      location: CUSTOMER_ASSISTANT_GEMINI_LOCATION,
      model: CUSTOMER_ASSISTANT_GEMINI_MODEL,
      projectId: 'utekos-production'
    }
  )
})

test('missing project or non-global location fails closed before client construction', () => {
  for (const environment of [
    {},
    { GCP_PROJECT_ID: '   ' },
    { ...validEnvironment, VERCEL: '1' },
    { ...validEnvironment, GCP_GEMINI_LOCATION: 'europe-west1' }
  ]) {
    let clientConstructionCount = 0

    assert.throws(
      () =>
        new GeminiSupportKnowledge(environment, {
          buildKnowledgeDocuments:
            buildAssistantKnowledgeDocuments,
          createClient: () => {
            clientConstructionCount += 1
            throw new Error('unexpected_client_construction')
          },
          createGoogleCloudClientOptions: () => undefined
        }),
      error =>
        error instanceof GeminiSupportKnowledgeConfigurationError
    )
    assert.equal(clientConstructionCount, 0)
  }
})

test('constructs the client lazily and sends the exact stateless grounded request', async () => {
  const harness = createAdapterHarness()
  const question = 'Hva koster frakt?'

  assert.equal(harness.clientConstructionCount, 0)
  await harness.adapter.answer({ productHandle: null, question })
  assert.equal(harness.clientConstructionCount, 1)
  assert.deepEqual(harness.clientOptions, {
    endpoint:
      'https://aiplatform.googleapis.com/v1/projects/utekos-production/locations/global/publishers/google/models/gemini-3.6-flash:generateContent',
    location: 'global',
    projectId: 'utekos-production'
  })
  assert.equal(harness.calls.length, 1)

  const call = harness.calls[0] as {
    request: Record<string, unknown>
    options: unknown
  }
  const generationConfig = call.request.generationConfig as {
    maxOutputTokens: number
    responseMimeType: string
    responseSchema: {
      properties: { source_urls: { items: { enum: string[] } } }
    }
    thinkingConfig: { thinkingLevel: string }
  }
  const contents = call.request.contents as Array<{
    parts: Array<{ text: string }>
    role: string
  }>
  const systemInstruction = call.request.systemInstruction as {
    parts: Array<{ text: string }>
  }
  const responseFormat = generationConfig.responseSchema as {
    properties: { source_urls: { items: { enum: string[] } } }
  }

  assert.deepEqual(generationConfig, {
    maxOutputTokens: 600,
    responseMimeType: 'application/json',
    responseSchema: responseFormat,
    thinkingConfig: { thinkingLevel: 'LOW' }
  })
  assert.equal('tools' in call.request, false)
  assert.equal('store' in call.request, false)
  assert.deepEqual(
    responseFormat.properties.source_urls.items.enum,
    approvedDocuments.map(document => document.canonicalUrl)
  )
  assert.match(
    systemInstruction.parts[0]?.text ?? '',
    /uten Markdown/u
  )
  assert.match(
    contents[0]?.parts[0]?.text ?? '',
    /GODKJENTE UTEKOS-KILDER/u
  )
  assert.match(
    contents[0]?.parts[0]?.text ?? '',
    new RegExp(question, 'u')
  )
  assert.equal(
    approvedDocuments.every(document =>
      (contents[0]?.parts[0]?.text ?? '').includes(
        document.content
      )
    ),
    true
  )
  assert.deepEqual(call.options, {
    retries: { strategy: 'none' },
    timeout_ms: 8_000
  })
})

test('forwards the validated OIDC client and rejects project mismatch', async () => {
  const authClient = {} as BaseExternalAccountClient
  const harness = createAdapterHarness({
    environment: {
      ...validEnvironment,
      GCP_CUSTOMER_ASSISTANT_SERVICE_ACCOUNT_EMAIL:
        'genai-app-runner@utekos-production.iam.gserviceaccount.com',
      VERCEL: '1'
    },
    googleCloudOptions: {
      authClient,
      projectId: 'utekos-production'
    }
  })

  await harness.adapter.answer({
    productHandle: null,
    question: 'Hva koster frakt?'
  })
  assert.deepEqual(harness.clientOptions, {
    authClient,
    endpoint:
      'https://aiplatform.googleapis.com/v1/projects/utekos-production/locations/global/publishers/google/models/gemini-3.6-flash:generateContent',
    location: 'global',
    projectId: 'utekos-production'
  })
  assert.equal(
    (
      harness.observedAuthEnvironment as Record<
        string,
        string | undefined
      >
    ).GCP_SERVICE_ACCOUNT_EMAIL,
    'genai-app-runner@utekos-production.iam.gserviceaccount.com'
  )

  const mismatch = createAdapterHarness({
    googleCloudOptions: {
      authClient,
      projectId: 'wrong-project'
    }
  })
  await assert.rejects(
    mismatch.adapter.answer({
      productHandle: null,
      question: 'Hva koster frakt?'
    }),
    error =>
      error instanceof GeminiSupportKnowledgeConfigurationError
  )
  assert.equal(mismatch.clientConstructionCount, 0)
})

test('maps a valid structured answer and de-duplicates approved sources', async () => {
  const harness = createAdapterHarness({
    response: generateContentWithText(
      JSON.stringify({
        answer: 'Fri frakt gjelder over 999 kr.',
        answerable: true,
        source_urls: [approvedSourceUrl, approvedSourceUrl]
      }),
      {
        modelVersion:
          'projects/utekos-production/locations/global/models/gemini-3.6-flash'
      }
    )
  })

  assert.deepEqual(
    await harness.adapter.answer({
      productHandle: null,
      question: 'Hva koster frakt?'
    }),
    {
      confidence: 'medium',
      sources: [
        { title: 'Frakt og retur', url: approvedSourceUrl }
      ],
      text: 'Fri frakt gjelder over 999 kr.'
    }
  )
})

test('returns the safe fallback for invalid or ungrounded provider output', async () => {
  const oversizedAnswer = 'a'.repeat(2_001)
  const responses: unknown[] = [
    null,
    {},
    {
      ...approvedAnswer,
      candidates: [
        {
          content: {
            parts: [{ text: '{"answer":"Svar"}' }],
            role: 'model'
          },
          finishReason: 'MAX_TOKENS'
        }
      ]
    },
    { ...approvedAnswer, modelVersion: 'gemini-3.5-flash' },
    generateContentWithText('not-json'),
    generateContentWithText(
      JSON.stringify({
        answer: 'Svar',
        answerable: false,
        source_urls: [approvedSourceUrl]
      })
    ),
    generateContentWithText(
      JSON.stringify({
        answer: 'Svar',
        answerable: true,
        source_urls: []
      })
    ),
    generateContentWithText(
      JSON.stringify({
        answer: 'Svar',
        answerable: true,
        source_urls: ['https://example.com/foreign']
      })
    ),
    generateContentWithText(
      JSON.stringify({
        answer: oversizedAnswer,
        answerable: true,
        source_urls: [approvedSourceUrl]
      })
    ),
    generateContentWithText(
      JSON.stringify({
        answer: 'Svar',
        answerable: true,
        extra: 'not-allowed',
        source_urls: [approvedSourceUrl]
      })
    )
  ]

  for (const response of responses) {
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

test('lets provider failures reach the route fail-closed handling', async () => {
  const dependencies: GeminiSupportKnowledgeDependencies = {
    buildKnowledgeDocuments: buildAssistantKnowledgeDocuments,
    createClient: () => ({
      async create() {
        throw Object.assign(new Error('provider_unavailable'), {
          statusCode: 503
        })
      }
    }),
    createGoogleCloudClientOptions: () => undefined
  }
  const adapter = new GeminiSupportKnowledge(
    validEnvironment,
    dependencies
  )

  await assert.rejects(
    adapter.answer({
      productHandle: null,
      question: 'Hva koster frakt?'
    }),
    error => {
      assert.ok(
        error instanceof GeminiSupportKnowledgeProviderError
      )
      assert.equal(error.code, 503)
      assert.equal(error.message, 'gcp_gemini_provider_error')
      return true
    }
  )
})

test('maps provider failures without a safe HTTP status to UNKNOWN', async () => {
  const adapter = new GeminiSupportKnowledge(validEnvironment, {
    buildKnowledgeDocuments: buildAssistantKnowledgeDocuments,
    createClient: () => ({
      async create() {
        throw new Error('sensitive_provider_detail')
      }
    }),
    createGoogleCloudClientOptions: () => undefined
  })

  await assert.rejects(
    adapter.answer({
      productHandle: null,
      question: 'Hva koster frakt?'
    }),
    error => {
      assert.ok(
        error instanceof GeminiSupportKnowledgeProviderError
      )
      assert.equal(error.code, 'UNKNOWN')
      assert.equal(error.message.includes('sensitive'), false)
      return true
    }
  )
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
