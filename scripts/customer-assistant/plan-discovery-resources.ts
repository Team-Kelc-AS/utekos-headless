import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { protos, v1 } from '@google-cloud/discoveryengine'
import { createGoogleCloudClientOptions } from '../../src/lib/google/auth/createGoogleCloudClientOptions'
import { buildAssistantKnowledgeDocuments } from '../../src/lib/google/customer-assistant/knowledgeManifest'

export const desiredDiscoveryResources = {
  projectId: 'project-c683eb2c-20ae-4ec2-ac3',
  location: 'global',
  collection: 'default_collection',
  dataStoreId: 'utekos-customer-support-v1',
  dataStoreDisplayName: 'Utekos Customer Support v1',
  engineId: 'utekos-customer-assistant-v1',
  engineDisplayName: 'Utekos Customer Assistant v1',
  servingConfigId: 'default_serving_config',
  branchId: 'default_branch'
} as const

type ResourceAction = 'create' | 'noop' | 'drift/manual_review'

export type DiscoveryDataStoreSnapshot = {
  contentConfig?: string | undefined
  displayName?: string | undefined
  industryVertical?: string | undefined
  name: string
  solutionTypes?: readonly string[]
}

export type DiscoveryEngineSnapshot = {
  dataStoreIds?: readonly string[]
  displayName?: string | undefined
  industryVertical?: string | undefined
  name: string
  searchAddOns?: readonly string[]
  searchTier?: string | undefined
  solutionType?: string | undefined
}

export type DiscoveryDocumentSnapshot = {
  id: string
  name: string
}

export type DiscoveryResourceSnapshot = {
  dataStores: readonly DiscoveryDataStoreSnapshot[]
  documents: readonly DiscoveryDocumentSnapshot[]
  engines: readonly DiscoveryEngineSnapshot[]
}

export type DiscoveryResourcePlan = {
  dataStore: { action: ResourceAction; name: string }
  documents: {
    missing: string[]
    present: string[]
    unexpected: string[]
  }
  engine: { action: ResourceAction; name: string }
  projectId: string
  servingConfig: string
  unrelatedDataStores: string[]
  unrelatedEngines: string[]
}

export type DiscoveryReadClients = {
  listDataStores(
    parent: string
  ): Promise<readonly DiscoveryDataStoreSnapshot[]>
  listDocuments(
    parent: string
  ): Promise<readonly DiscoveryDocumentSnapshot[]>
  listEngines(
    parent: string
  ): Promise<readonly DiscoveryEngineSnapshot[]>
}

export function discoveryResourceNames() {
  const collection = [
    'projects',
    desiredDiscoveryResources.projectId,
    'locations',
    desiredDiscoveryResources.location,
    'collections',
    desiredDiscoveryResources.collection
  ].join('/')
  const dataStore = `${collection}/dataStores/${desiredDiscoveryResources.dataStoreId}`
  const engine = `${collection}/engines/${desiredDiscoveryResources.engineId}`
  const branch = `${dataStore}/branches/${desiredDiscoveryResources.branchId}`

  return {
    branch,
    collection,
    dataStore,
    engine,
    servingConfig: `${engine}/servingConfigs/${desiredDiscoveryResources.servingConfigId}`
  }
}

function sameSet(
  actual: readonly string[] | undefined,
  expected: readonly string[]
) {
  return (
    actual !== undefined &&
    actual.length === expected.length &&
    expected.every(value => actual.includes(value))
  )
}

function hasResourceId(
  name: string,
  resourceKind: 'dataStores' | 'engines',
  id: string
) {
  return name.endsWith(`/${resourceKind}/${id}`)
}

export function isDesiredDataStore(
  dataStore: DiscoveryDataStoreSnapshot
) {
  return (
    hasResourceId(
      dataStore.name,
      'dataStores',
      desiredDiscoveryResources.dataStoreId
    ) &&
    dataStore.displayName ===
      desiredDiscoveryResources.dataStoreDisplayName &&
    dataStore.industryVertical === 'GENERIC' &&
    dataStore.contentConfig === 'CONTENT_REQUIRED' &&
    sameSet(dataStore.solutionTypes, ['SOLUTION_TYPE_SEARCH'])
  )
}

export function isDesiredEngine(
  engine: DiscoveryEngineSnapshot
) {
  return (
    hasResourceId(
      engine.name,
      'engines',
      desiredDiscoveryResources.engineId
    ) &&
    engine.displayName ===
      desiredDiscoveryResources.engineDisplayName &&
    engine.industryVertical === 'GENERIC' &&
    engine.solutionType === 'SOLUTION_TYPE_SEARCH' &&
    engine.searchTier === 'SEARCH_TIER_ENTERPRISE' &&
    sameSet(engine.searchAddOns, ['SEARCH_ADD_ON_LLM']) &&
    sameSet(engine.dataStoreIds, [
      desiredDiscoveryResources.dataStoreId
    ])
  )
}

export function planDiscoveryResources(
  snapshot: DiscoveryResourceSnapshot,
  reviewedDocumentIds: readonly string[]
): DiscoveryResourcePlan {
  const names = discoveryResourceNames()
  const dedicatedDataStore = snapshot.dataStores.find(
    dataStore =>
      hasResourceId(
        dataStore.name,
        'dataStores',
        desiredDiscoveryResources.dataStoreId
      )
  )
  const dedicatedEngine = snapshot.engines.find(engine =>
    hasResourceId(
      engine.name,
      'engines',
      desiredDiscoveryResources.engineId
    )
  )
  const actualDocumentIds = new Set(
    snapshot.documents.map(document => document.id)
  )
  const reviewedIds = new Set(reviewedDocumentIds)

  return {
    dataStore: {
      action:
        !dedicatedDataStore ? 'create'
        : isDesiredDataStore(dedicatedDataStore) ? 'noop'
        : 'drift/manual_review',
      name: names.dataStore
    },
    documents: {
      missing: reviewedDocumentIds.filter(
        id => !actualDocumentIds.has(id)
      ),
      present: reviewedDocumentIds.filter(id =>
        actualDocumentIds.has(id)
      ),
      unexpected: [...actualDocumentIds]
        .filter(id => !reviewedIds.has(id))
        .sort()
    },
    engine: {
      action:
        !dedicatedEngine ? 'create'
        : isDesiredEngine(dedicatedEngine) ? 'noop'
        : 'drift/manual_review',
      name: names.engine
    },
    projectId: desiredDiscoveryResources.projectId,
    servingConfig: names.servingConfig,
    unrelatedDataStores: snapshot.dataStores
      .filter(
        dataStore =>
          !hasResourceId(
            dataStore.name,
            'dataStores',
            desiredDiscoveryResources.dataStoreId
          )
      )
      .map(dataStore => dataStore.name)
      .sort(),
    unrelatedEngines: snapshot.engines
      .filter(
        engine =>
          !hasResourceId(
            engine.name,
            'engines',
            desiredDiscoveryResources.engineId
          )
      )
      .map(engine => engine.name)
      .sort()
  }
}

export async function readDiscoveryResourceSnapshot(
  clients: DiscoveryReadClients
): Promise<DiscoveryResourceSnapshot> {
  const names = discoveryResourceNames()
  const dataStores = await clients.listDataStores(
    names.collection
  )
  const engines = await clients.listEngines(names.collection)
  const dedicatedStoreExists = dataStores.some(dataStore =>
    hasResourceId(
      dataStore.name,
      'dataStores',
      desiredDiscoveryResources.dataStoreId
    )
  )
  const documents =
    dedicatedStoreExists ?
      await clients.listDocuments(names.branch)
    : []

  return { dataStores, documents, engines }
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
): DiscoveryDataStoreSnapshot | null {
  if (!dataStore.name) return null

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
    name: dataStore.name,
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
): DiscoveryEngineSnapshot | null {
  if (!engine.name) return null

  return {
    dataStoreIds: engine.dataStoreIds ?? [],
    displayName: engine.displayName ?? undefined,
    industryVertical: enumName(
      protos.google.cloud.discoveryengine.v1.IndustryVertical,
      engine.industryVertical
    ),
    name: engine.name,
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

export function createDiscoveryReadClients(
  environment: Readonly<
    Record<string, string | undefined>
  > = process.env
): DiscoveryReadClients {
  const options = createDiscoveryClientOptions(environment)
  const dataStoreClient = new v1.DataStoreServiceClient(options)
  const engineClient = new v1.EngineServiceClient(options)
  const documentClient = new v1.DocumentServiceClient(options)

  return {
    async listDataStores(parent) {
      const [dataStores] = await dataStoreClient.listDataStores({
        parent
      })
      return dataStores
        .map(mapDataStore)
        .filter(
          (dataStore): dataStore is DiscoveryDataStoreSnapshot =>
            dataStore !== null
        )
    },
    async listDocuments(parent) {
      const [documents] = await documentClient.listDocuments({
        parent
      })
      return documents.flatMap(document => {
        const id =
          document.id ?? document.name?.split('/').at(-1) ?? null
        if (!id || !document.name) return []
        return [{ id, name: document.name }]
      })
    },
    async listEngines(parent) {
      const [engines] = await engineClient.listEngines({
        parent
      })
      return engines
        .map(mapEngine)
        .filter(
          (engine): engine is DiscoveryEngineSnapshot =>
            engine !== null
        )
    }
  }
}

export function createDiscoveryClientOptions(
  environment: Readonly<
    Record<string, string | undefined>
  > = process.env
) {
  const sharedOptions =
    createGoogleCloudClientOptions(environment)

  if (
    sharedOptions &&
    sharedOptions.projectId !==
      desiredDiscoveryResources.projectId
  ) {
    throw new Error('gcp_discovery_project_mismatch')
  }

  return {
    ...sharedOptions,
    apiEndpoint: `${desiredDiscoveryResources.location}-discoveryengine.googleapis.com`,
    projectId: desiredDiscoveryResources.projectId
  } as unknown as ConstructorParameters<
    typeof v1.DataStoreServiceClient
  >[0]
}

function classifyReadFailure(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (typeof error.code === 'number' ||
      typeof error.code === 'string')
  ) {
    return `gcp_discovery_plan_failed:${String(error.code)}`
  }

  if (
    error instanceof Error &&
    error.message.startsWith('gcp_')
  ) {
    return error.message
  }

  return 'gcp_discovery_plan_failed'
}

export async function runDiscoveryResourcePlan(
  dependencies: {
    createClients: () => DiscoveryReadClients
    log: (line: string) => void
  } = {
    createClients: () => createDiscoveryReadClients(),
    log: console.log
  }
) {
  const reviewedIds = buildAssistantKnowledgeDocuments().map(
    document => document.id
  )
  const snapshot = await readDiscoveryResourceSnapshot(
    dependencies.createClients()
  )
  const plan = planDiscoveryResources(snapshot, reviewedIds)
  dependencies.log(JSON.stringify(plan, null, 2))
  return plan
}

const invokedPath =
  process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  void runDiscoveryResourcePlan().catch(error => {
    console.error(classifyReadFailure(error))
    process.exitCode = 1
  })
}
