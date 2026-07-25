import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { protos, v1 } from '@google-cloud/discoveryengine'
import { buildAssistantKnowledgeDocuments } from '../../src/lib/google/customer-assistant/knowledgeManifest'
import {
  createDiscoveryClientOptions,
  desiredDiscoveryResources,
  discoveryResourceNames,
  isDesiredDataStore,
  isDesiredEngine,
  type DiscoveryDataStoreSnapshot,
  type DiscoveryEngineSnapshot
} from './plan-discovery-resources'

const APPROVAL_TOKEN = 'approved-utekos-assistant-v1'
const REVIEWED_DOCUMENT_IDS = [
  'compare-models',
  'comfyrobe-faq',
  'shipping-returns',
  'size-guide',
  'materials',
  'care',
  'contact'
] as const

type ApplyEnvironment = Readonly<
  Record<string, string | undefined>
>

type ImportDocument = {
  canonicalUrl: `https://utekos.no/${string}`
  content: string
  id: string
}

type LongRunningOperation = {
  name?: string | null
  promise(): Promise<readonly [unknown, unknown?, unknown?]>
}

type CreateDataStoreRequest =
  protos.google.cloud.discoveryengine.v1.ICreateDataStoreRequest
type CreateEngineRequest =
  protos.google.cloud.discoveryengine.v1.ICreateEngineRequest
type ImportDocumentsRequest =
  protos.google.cloud.discoveryengine.v1.IImportDocumentsRequest

export type DiscoveryApplyClients = {
  createDataStore(
    request: CreateDataStoreRequest
  ): Promise<LongRunningOperation>
  createEngine(
    request: CreateEngineRequest
  ): Promise<LongRunningOperation>
  getDataStore(): Promise<DiscoveryDataStoreSnapshot | null>
  getEngine(): Promise<DiscoveryEngineSnapshot | null>
  importDocuments(
    request: ImportDocumentsRequest
  ): Promise<LongRunningOperation>
}

export type DiscoveryApplyDependencies = {
  buildDocuments: () => readonly ImportDocument[]
  createClients: () => DiscoveryApplyClients
  log: (line: string) => void
}

function assertApplyGate(
  argv: readonly string[],
  environment: ApplyEnvironment
) {
  if (
    !argv.includes('--apply') ||
    environment.ASSISTANT_GCP_APPLY_APPROVAL !== APPROVAL_TOKEN
  ) {
    throw new Error('gcp_apply_requires_explicit_approval')
  }
}

function operationName(operation: LongRunningOperation) {
  return operation.name?.trim() || 'operation_name_unavailable'
}

function countValue(value: unknown) {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return String(value)
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toString' in value &&
    typeof value.toString === 'function'
  ) {
    return value.toString()
  }
  return '0'
}

function importSummary(result: unknown, metadata: unknown) {
  const response =
    typeof result === 'object' && result !== null ? result : {}
  const counts =
    typeof metadata === 'object' && metadata !== null ?
      metadata
    : {}
  const errorSamples =
    (
      'errorSamples' in response &&
      Array.isArray(response.errorSamples)
    ) ?
      response.errorSamples.slice(0, 3).map(sample => {
        if (
          typeof sample === 'object' &&
          sample !== null &&
          'code' in sample
        ) {
          return { code: String(sample.code) }
        }
        return { code: 'unknown' }
      })
    : []

  return {
    errorSamples,
    failureCount:
      'failureCount' in counts ?
        countValue(counts.failureCount)
      : '0',
    successCount:
      'successCount' in counts ?
        countValue(counts.successCount)
      : '0',
    totalCount:
      'totalCount' in counts ?
        countValue(counts.totalCount)
      : '0'
  }
}

function validateReviewedDocuments(
  documents: readonly ImportDocument[]
) {
  if (
    documents.length !== REVIEWED_DOCUMENT_IDS.length ||
    documents.some(
      (document, index) =>
        document.id !== REVIEWED_DOCUMENT_IDS[index] ||
        !document.canonicalUrl.startsWith(
          'https://utekos.no/'
        ) ||
        !document.content.trim()
    )
  ) {
    throw new Error('gcp_discovery_reviewed_documents_invalid')
  }
}

function toInlineDocument(document: ImportDocument) {
  return {
    id: document.id,
    structData: {
      fields: { uri: { stringValue: document.canonicalUrl } }
    },
    content: {
      rawBytes: Buffer.from(document.content, 'utf8'),
      mimeType: 'text/plain'
    }
  }
}

function enumName<T extends Record<string, string | number>>(
  values: T,
  value: number | string | null | undefined
) {
  if (typeof value === 'number') return String(values[value])
  return value ?? undefined
}

function mapDataStore(
  dataStore: protos.google.cloud.discoveryengine.v1.IDataStore
): DiscoveryDataStoreSnapshot {
  return {
    contentConfig: enumName(
      protos.google.cloud.discoveryengine.v1.DataStore
        .ContentConfig,
      dataStore.contentConfig
    ),
    displayName: dataStore.displayName ?? undefined,
    industryVertical: enumName(
      protos.google.cloud.discoveryengine.v1.IndustryVertical,
      dataStore.industryVertical
    ),
    name: dataStore.name ?? discoveryResourceNames().dataStore,
    solutionTypes: (dataStore.solutionTypes ?? []).map(
      solutionType =>
        enumName(
          protos.google.cloud.discoveryengine.v1.SolutionType,
          solutionType
        )
    ) as string[]
  }
}

function mapEngine(
  engine: protos.google.cloud.discoveryengine.v1.IEngine
): DiscoveryEngineSnapshot {
  return {
    dataStoreIds: engine.dataStoreIds ?? [],
    displayName: engine.displayName ?? undefined,
    industryVertical: enumName(
      protos.google.cloud.discoveryengine.v1.IndustryVertical,
      engine.industryVertical
    ),
    name: engine.name ?? discoveryResourceNames().engine,
    searchAddOns: (
      engine.searchEngineConfig?.searchAddOns ?? []
    ).map(addOn =>
      enumName(
        protos.google.cloud.discoveryengine.v1.SearchAddOn,
        addOn
      )
    ) as string[],
    searchTier: enumName(
      protos.google.cloud.discoveryengine.v1.SearchTier,
      engine.searchEngineConfig?.searchTier
    ),
    solutionType: enumName(
      protos.google.cloud.discoveryengine.v1.SolutionType,
      engine.solutionType
    )
  }
}

function isNotFound(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 5 ||
      error.code === 404 ||
      error.code === '5')
  )
}

export function createDiscoveryApplyClients(
  environment: ApplyEnvironment = process.env
): DiscoveryApplyClients {
  const options = createDiscoveryClientOptions(environment)
  const names = discoveryResourceNames()
  const dataStoreClient = new v1.DataStoreServiceClient(options)
  const engineClient = new v1.EngineServiceClient(options)
  const documentClient = new v1.DocumentServiceClient(options)

  return {
    async createDataStore(request) {
      const [operation] =
        await dataStoreClient.createDataStore(request)
      return operation
    },
    async createEngine(request) {
      const [operation] =
        await engineClient.createEngine(request)
      return operation
    },
    async getDataStore() {
      try {
        const [dataStore] = await dataStoreClient.getDataStore({
          name: names.dataStore
        })
        return mapDataStore(dataStore)
      } catch (error) {
        if (isNotFound(error)) return null
        throw error
      }
    },
    async getEngine() {
      try {
        const [engine] = await engineClient.getEngine({
          name: names.engine
        })
        return mapEngine(engine)
      } catch (error) {
        if (isNotFound(error)) return null
        throw error
      }
    },
    async importDocuments(request) {
      const [operation] =
        await documentClient.importDocuments(request)
      return operation
    }
  }
}

const defaultDependencies: DiscoveryApplyDependencies = {
  buildDocuments: () => buildAssistantKnowledgeDocuments(),
  createClients: () => createDiscoveryApplyClients(),
  log: console.log
}

export async function runDiscoveryResourceApply(
  argv: readonly string[] = process.argv.slice(2),
  environment: ApplyEnvironment = process.env,
  dependencies: DiscoveryApplyDependencies = defaultDependencies
) {
  // This must remain the first executable boundary: no auth, clients, corpus,
  // or provider code may be reached before both explicit gates pass.
  assertApplyGate(argv, environment)

  const clients = dependencies.createClients()
  const names = discoveryResourceNames()
  const dataStore = await clients.getDataStore()

  if (dataStore && !isDesiredDataStore(dataStore)) {
    throw new Error('gcp_discovery_data_store_drift')
  }

  if (!dataStore) {
    const operation = await clients.createDataStore({
      parent: names.collection,
      dataStoreId: desiredDiscoveryResources.dataStoreId,
      dataStore: {
        displayName:
          desiredDiscoveryResources.dataStoreDisplayName,
        industryVertical: 'GENERIC',
        solutionTypes: [
          protos.google.cloud.discoveryengine.v1.SolutionType
            .SOLUTION_TYPE_SEARCH
        ],
        contentConfig: 'CONTENT_REQUIRED'
      }
    })
    await operation.promise()
    dependencies.log(
      JSON.stringify({
        operation: operationName(operation),
        resource: names.dataStore
      })
    )
  } else {
    dependencies.log(
      JSON.stringify({ resource: names.dataStore })
    )
  }

  const engine = await clients.getEngine()
  if (engine && !isDesiredEngine(engine)) {
    throw new Error('gcp_discovery_engine_drift')
  }

  if (!engine) {
    const operation = await clients.createEngine({
      parent: names.collection,
      engineId: desiredDiscoveryResources.engineId,
      engine: {
        displayName: desiredDiscoveryResources.engineDisplayName,
        industryVertical: 'GENERIC',
        solutionType: 'SOLUTION_TYPE_SEARCH',
        dataStoreIds: [desiredDiscoveryResources.dataStoreId],
        searchEngineConfig: {
          searchTier: 'SEARCH_TIER_ENTERPRISE',
          searchAddOns: [
            protos.google.cloud.discoveryengine.v1.SearchAddOn
              .SEARCH_ADD_ON_LLM
          ]
        }
      }
    })
    await operation.promise()
    dependencies.log(
      JSON.stringify({
        operation: operationName(operation),
        resource: names.engine
      })
    )
  } else {
    dependencies.log(JSON.stringify({ resource: names.engine }))
  }

  const documents = dependencies.buildDocuments()
  validateReviewedDocuments(documents)
  const importOperation = await clients.importDocuments({
    parent: names.branch,
    reconciliationMode: 'INCREMENTAL',
    inlineSource: { documents: documents.map(toInlineDocument) }
  })
  const [importResult, importMetadata] =
    await importOperation.promise()
  const summary = importSummary(importResult, importMetadata)
  dependencies.log(
    JSON.stringify({
      operation: operationName(importOperation),
      resource: names.branch,
      ...summary
    })
  )

  return { imported: documents.length, ...summary }
}

function safeApplyError(error: unknown) {
  if (
    error instanceof Error &&
    error.message.startsWith('gcp_')
  ) {
    return error.message
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (typeof error.code === 'number' ||
      typeof error.code === 'string')
  ) {
    return `gcp_discovery_apply_failed:${String(error.code)}`
  }
  return 'gcp_discovery_apply_failed'
}

const invokedPath =
  process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  void runDiscoveryResourceApply().catch(error => {
    console.error(safeApplyError(error))
    process.exitCode = 1
  })
}
