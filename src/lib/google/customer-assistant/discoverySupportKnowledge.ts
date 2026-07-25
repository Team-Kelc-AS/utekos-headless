import { v1, type protos } from '@google-cloud/discoveryengine'
import { z } from 'zod'
import type {
  SupportKnowledgeAdapter,
  SupportKnowledgeResult
} from '@/lib/customer-assistant/server/assistantAdapters'
import {
  createGoogleCloudClientOptions,
  type GoogleCloudClientOptions
} from '@/lib/google/auth/createGoogleCloudClientOptions'
import {
  buildAssistantKnowledgeDocuments,
  type AssistantKnowledgeDocument
} from './knowledgeManifest'

type Environment = Readonly<Record<string, string | undefined>>
type DiscoveryLocation = 'global' | 'us' | 'eu'
type DiscoveryClientOptions = ConstructorParameters<
  typeof v1.ConversationalSearchServiceClient
>[0]
type ConcreteDiscoveryClientOptions = Exclude<
  DiscoveryClientOptions,
  undefined
>
type AnswerQueryRequest =
  protos.google.cloud.discoveryengine.v1.IAnswerQueryRequest
type AnswerQueryResponse =
  protos.google.cloud.discoveryengine.v1.IAnswerQueryResponse

type DiscoveryAnswerQueryClient = {
  answerQuery(
    request: AnswerQueryRequest,
    options: { timeout: number }
  ): Promise<[AnswerQueryResponse, unknown?, unknown?]>
}

export type DiscoverySupportKnowledgeDependencies = {
  buildKnowledgeDocuments: () => AssistantKnowledgeDocument[]
  createClient: (
    options: ConcreteDiscoveryClientOptions
  ) => DiscoveryAnswerQueryClient
  createGoogleCloudClientOptions: (
    environment: Environment
  ) => GoogleCloudClientOptions | undefined
}

export type DiscoverySupportKnowledgeConfig = {
  engineId: string
  location: DiscoveryLocation
  projectId: string
}

const SAFE_NO_ANSWER_TEXT =
  'Jeg fant ikke et sikkert svar i det godkjente Utekos-innholdet.'
const COLLECTION_ID = 'default_collection'
const SERVING_CONFIG_ID = 'default_serving_config'
const ANSWER_QUERY_TIMEOUT_MS = 8_000
const MAX_ANSWER_LENGTH = 2_000
const MAX_SOURCE_COUNT = 5

const optionalUriSchema = z
  .object({ uri: z.string().nullable().optional() })
  .passthrough()
  .nullable()
  .optional()

const answerReferenceSchema = z
  .object({
    chunkInfo: z
      .object({ documentMetadata: optionalUriSchema })
      .passthrough()
      .nullable()
      .optional(),
    structuredDocumentInfo: optionalUriSchema,
    unstructuredDocumentInfo: optionalUriSchema
  })
  .passthrough()

const discoveryAnswerResponseSchema = z
  .object({
    answer: z
      .object({
        answerSkippedReasons: z
          .array(z.union([z.number(), z.string()]))
          .nullable()
          .optional(),
        answerText: z.string().nullable().optional(),
        references: z
          .array(answerReferenceSchema)
          .nullable()
          .optional(),
        safetyRatings: z
          .array(
            z
              .object({
                blocked: z.boolean().nullable().optional()
              })
              .passthrough()
          )
          .nullable()
          .optional()
      })
      .passthrough()
      .nullable()
      .optional()
  })
  .passthrough()

const defaultDependencies: DiscoverySupportKnowledgeDependencies =
  {
    buildKnowledgeDocuments: buildAssistantKnowledgeDocuments,
    createClient: options => {
      const client = new v1.ConversationalSearchServiceClient(
        options
      )

      return {
        async answerQuery(request, callOptions) {
          const [response, requestEcho, metadata] =
            await client.answerQuery(request, callOptions)

          return [response, requestEcho, metadata]
        }
      }
    },
    createGoogleCloudClientOptions
  }

export class DiscoverySupportKnowledgeConfigurationError extends Error {
  readonly code = 'gcp_discovery_not_configured'

  constructor() {
    super('gcp_discovery_not_configured')
    this.name = 'DiscoverySupportKnowledgeConfigurationError'
  }
}

function configuredValue(
  environment: Environment,
  name: string
) {
  const value = environment[name]?.trim()

  if (!value) {
    throw new DiscoverySupportKnowledgeConfigurationError()
  }

  return value
}

export function readDiscoverySupportKnowledgeConfig(
  environment: Environment = process.env
): DiscoverySupportKnowledgeConfig {
  const projectId = configuredValue(
    environment,
    'GCP_PROJECT_ID'
  )
  const engineId = configuredValue(
    environment,
    'GCP_DISCOVERY_ENGINE_ID'
  )
  const locationValue =
    environment.GCP_DISCOVERY_LOCATION?.trim() || 'global'

  if (!['global', 'us', 'eu'].includes(locationValue)) {
    throw new DiscoverySupportKnowledgeConfigurationError()
  }

  return {
    engineId,
    location: locationValue as DiscoveryLocation,
    projectId
  }
}

function createServingConfig({
  engineId,
  location,
  projectId
}: DiscoverySupportKnowledgeConfig) {
  const engine = [
    'projects',
    projectId,
    'locations',
    location,
    'collections',
    COLLECTION_ID,
    'engines',
    engineId
  ].join('/')

  return {
    servingConfig: `${engine}/servingConfigs/${SERVING_CONFIG_ID}`,
    session: `${engine}/sessions/-`
  }
}

function lowConfidenceResult(): SupportKnowledgeResult {
  return {
    confidence: 'low',
    sources: [],
    text: SAFE_NO_ANSWER_TEXT
  }
}

function getReferenceUris(
  reference: z.infer<typeof answerReferenceSchema>
) {
  return [
    reference.unstructuredDocumentInfo?.uri,
    reference.structuredDocumentInfo?.uri,
    reference.chunkInfo?.documentMetadata?.uri
  ]
}

export class DiscoverySupportKnowledge implements SupportKnowledgeAdapter {
  readonly #approvedSources: ReadonlyMap<
    string,
    { title: string; url: string }
  >
  readonly #config: DiscoverySupportKnowledgeConfig
  readonly #dependencies: DiscoverySupportKnowledgeDependencies
  readonly #environment: Environment
  #client: DiscoveryAnswerQueryClient | undefined

  constructor(
    environment: Environment = process.env,
    dependencies: DiscoverySupportKnowledgeDependencies = defaultDependencies
  ) {
    this.#config =
      readDiscoverySupportKnowledgeConfig(environment)
    this.#environment = environment
    this.#dependencies = dependencies
    this.#approvedSources = new Map(
      dependencies
        .buildKnowledgeDocuments()
        .map(document => [
          document.canonicalUrl,
          { title: document.title, url: document.canonicalUrl }
        ])
    )
  }

  #getClient() {
    if (this.#client) return this.#client

    const googleCloudOptions =
      this.#dependencies.createGoogleCloudClientOptions(
        this.#environment
      )
    const apiEndpoint =
      this.#config.location === 'global' ?
        'discoveryengine.googleapis.com'
      : `${this.#config.location}-discoveryengine.googleapis.com`

    const clientOptions: ConcreteDiscoveryClientOptions =
      googleCloudOptions ?
        {
          apiEndpoint,
          authClient:
            googleCloudOptions.authClient as unknown as NonNullable<
              ConcreteDiscoveryClientOptions['authClient']
            >,
          projectId: googleCloudOptions.projectId
        }
      : { apiEndpoint }

    this.#client = this.#dependencies.createClient(clientOptions)

    return this.#client
  }

  async answer({
    question
  }: Parameters<
    SupportKnowledgeAdapter['answer']
  >[0]): Promise<SupportKnowledgeResult> {
    const { servingConfig, session } = createServingConfig(
      this.#config
    )
    const [rawResponse] = await this.#getClient().answerQuery(
      {
        answerGenerationSpec: {
          ignoreAdversarialQuery: true,
          ignoreLowRelevantContent: true,
          ignoreNonAnswerSeekingQuery: true,
          includeCitations: true
        },
        query: { text: question },
        servingConfig,
        session
      },
      { timeout: ANSWER_QUERY_TIMEOUT_MS }
    )
    const parsedResponse =
      discoveryAnswerResponseSchema.safeParse(rawResponse)

    if (!parsedResponse.success || !parsedResponse.data.answer) {
      return lowConfidenceResult()
    }

    const answer = parsedResponse.data.answer
    const text = answer.answerText?.trim() ?? ''
    const skipped =
      (answer.answerSkippedReasons?.length ?? 0) > 0
    const safetyBlocked =
      answer.safetyRatings?.some(rating => rating.blocked) ??
      false

    if (
      !text ||
      text.length > MAX_ANSWER_LENGTH ||
      skipped ||
      safetyBlocked
    ) {
      return lowConfidenceResult()
    }

    const sources = []
    const seenUrls = new Set<string>()

    for (const reference of answer.references ?? []) {
      for (const uri of getReferenceUris(reference)) {
        if (!uri || seenUrls.has(uri)) continue

        const source = this.#approvedSources.get(uri)
        if (!source) continue

        sources.push(source)
        seenUrls.add(uri)

        if (sources.length === MAX_SOURCE_COUNT) break
      }

      if (sources.length === MAX_SOURCE_COUNT) break
    }

    if (sources.length === 0) return lowConfidenceResult()

    return { confidence: 'medium', sources, text }
  }
}
