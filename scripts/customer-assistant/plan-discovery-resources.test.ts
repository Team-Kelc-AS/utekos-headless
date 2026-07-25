import assert from 'node:assert/strict'
import test from 'node:test'
import {
  desiredDiscoveryResources,
  planDiscoveryResources,
  readDiscoveryResourceSnapshot
} from './plan-discovery-resources'
import { runDiscoveryResourceApply } from './apply-discovery-resources'

const collectionName =
  'projects/project-c683eb2c-20ae-4ec2-ac3/locations/global/collections/default_collection'
const dataStoreName = `${collectionName}/dataStores/utekos-customer-support-v1`
const branchName = `${dataStoreName}/branches/default_branch`
const numericProjectCollectionName =
  'projects/741353863697/locations/global/collections/default_collection'
const reviewedIds = [
  'compare-models',
  'comfyrobe-faq',
  'shipping-returns',
  'size-guide',
  'materials',
  'care',
  'contact'
]

const matchingDataStore = {
  contentConfig: 'CONTENT_REQUIRED',
  displayName: 'Utekos Customer Support v1',
  industryVertical: 'GENERIC',
  name: `${numericProjectCollectionName}/dataStores/utekos-customer-support-v1`,
  solutionTypes: ['SOLUTION_TYPE_SEARCH']
} as const

const matchingEngine = {
  dataStoreIds: ['utekos-customer-support-v1'],
  displayName: 'Utekos Customer Assistant v1',
  industryVertical: 'GENERIC',
  name: `${numericProjectCollectionName}/engines/utekos-customer-assistant-v1`,
  searchAddOns: ['SEARCH_ADD_ON_LLM'],
  searchTier: 'SEARCH_TIER_ENTERPRISE',
  solutionType: 'SOLUTION_TYPE_SEARCH'
} as const

test('pins the dedicated project and current default serving config', () => {
  assert.deepEqual(desiredDiscoveryResources, {
    branchId: 'default_branch',
    collection: 'default_collection',
    dataStoreDisplayName: 'Utekos Customer Support v1',
    dataStoreId: 'utekos-customer-support-v1',
    engineDisplayName: 'Utekos Customer Assistant v1',
    engineId: 'utekos-customer-assistant-v1',
    location: 'global',
    projectId: 'project-c683eb2c-20ae-4ec2-ac3',
    servingConfigId: 'default_serving_config'
  })
})

test('plans create/noop/manual review without deletion and isolates unrelated resources', () => {
  const absentPlan = planDiscoveryResources(
    {
      dataStores: [
        {
          ...matchingDataStore,
          name: `${collectionName}/dataStores/unrelated-store`
        }
      ],
      documents: [],
      engines: [
        {
          ...matchingEngine,
          name: `${collectionName}/engines/unrelated-engine`
        }
      ]
    },
    reviewedIds
  )

  assert.equal(absentPlan.dataStore.action, 'create')
  assert.equal(absentPlan.engine.action, 'create')
  assert.deepEqual(absentPlan.documents.missing, reviewedIds)
  assert.deepEqual(absentPlan.documents.present, [])
  assert.deepEqual(absentPlan.documents.unexpected, [])
  assert.deepEqual(absentPlan.unrelatedDataStores, [
    `${collectionName}/dataStores/unrelated-store`
  ])
  assert.deepEqual(absentPlan.unrelatedEngines, [
    `${collectionName}/engines/unrelated-engine`
  ])
  assert.doesNotMatch(
    JSON.stringify(absentPlan),
    /delete|purge/u
  )

  const matchingPlan = planDiscoveryResources(
    {
      dataStores: [matchingDataStore],
      documents: [
        ...reviewedIds.map(id => ({
          id,
          name: `${branchName}/documents/${id}`
        })),
        {
          id: 'unexpected',
          name: `${branchName}/documents/unexpected`
        }
      ],
      engines: [matchingEngine]
    },
    reviewedIds
  )

  assert.equal(matchingPlan.dataStore.action, 'noop')
  assert.equal(matchingPlan.engine.action, 'noop')
  assert.deepEqual(matchingPlan.documents.present, reviewedIds)
  assert.deepEqual(matchingPlan.documents.unexpected, [
    'unexpected'
  ])

  const driftPlan = planDiscoveryResources(
    {
      dataStores: [
        { ...matchingDataStore, displayName: 'Wrong' }
      ],
      documents: [],
      engines: [
        { ...matchingEngine, dataStoreIds: ['other-store'] }
      ]
    },
    reviewedIds
  )

  assert.equal(driftPlan.dataStore.action, 'drift/manual_review')
  assert.equal(driftPlan.engine.action, 'drift/manual_review')
})

test('provider snapshot reader uses list methods only and reads documents only for the dedicated store', async () => {
  const calls: string[] = []
  const snapshot = await readDiscoveryResourceSnapshot({
    async listDataStores(parent) {
      calls.push(`listDataStores:${parent}`)
      return [matchingDataStore]
    },
    async listDocuments(parent) {
      calls.push(`listDocuments:${parent}`)
      return reviewedIds.map(id => ({
        id,
        name: `${branchName}/documents/${id}`
      }))
    },
    async listEngines(parent) {
      calls.push(`listEngines:${parent}`)
      return [matchingEngine]
    }
  })

  assert.deepEqual(calls, [
    `listDataStores:${collectionName}`,
    `listEngines:${collectionName}`,
    `listDocuments:${branchName}`
  ])
  assert.equal(snapshot.documents.length, 7)

  calls.length = 0
  await readDiscoveryResourceSnapshot({
    async listDataStores() {
      calls.push('listDataStores')
      return []
    },
    async listDocuments() {
      calls.push('listDocuments')
      return []
    },
    async listEngines() {
      calls.push('listEngines')
      return []
    }
  })
  assert.deepEqual(calls, ['listDataStores', 'listEngines'])
})

test('every missing or wrong apply gate exits before constructing clients', async () => {
  const combinations = [
    { argv: [], token: undefined },
    { argv: ['--apply'], token: undefined },
    { argv: [], token: 'approved-utekos-assistant-v1' },
    { argv: ['--apply'], token: 'wrong' }
  ] as const

  for (const combination of combinations) {
    let clientCalls = 0
    await assert.rejects(
      runDiscoveryResourceApply(
        combination.argv,
        { ASSISTANT_GCP_APPLY_APPROVAL: combination.token },
        {
          buildDocuments() {
            throw new Error('documents_must_not_be_read')
          },
          createClients() {
            clientCalls += 1
            throw new Error('clients_must_not_be_created')
          },
          log() {
            throw new Error('log_must_not_be_called')
          }
        }
      ),
      { message: 'gcp_apply_requires_explicit_approval' }
    )
    assert.equal(clientCalls, 0)
  }
})

test('approved apply creates absent dedicated resources, waits, then incrementally imports seven stable documents', async () => {
  const calls: string[] = []
  const requests: unknown[] = []
  let dataStoreExists = false
  let engineExists = false

  const operation = (
    name: string,
    result: unknown,
    metadata: unknown = {}
  ) => ({
    name,
    async promise() {
      calls.push(`wait:${name}`)
      return [result, metadata] as const
    }
  })

  const result = await runDiscoveryResourceApply(
    ['--apply'],
    {
      ASSISTANT_GCP_APPLY_APPROVAL:
        'approved-utekos-assistant-v1'
    },
    {
      buildDocuments: () =>
        reviewedIds.map(id => ({
          canonicalUrl: `https://utekos.no/${id}` as const,
          content: `Reviewed ${id}`,
          id
        })),
      createClients: () => ({
        async createDataStore(request) {
          calls.push('createDataStore')
          requests.push(request)
          dataStoreExists = true
          return operation(
            'operations/create-data-store',
            matchingDataStore
          )
        },
        async createEngine(request) {
          calls.push('createEngine')
          requests.push(request)
          engineExists = true
          return operation(
            'operations/create-engine',
            matchingEngine
          )
        },
        async getDataStore() {
          calls.push('getDataStore')
          return dataStoreExists ? matchingDataStore : null
        },
        async getEngine() {
          calls.push('getEngine')
          return engineExists ? matchingEngine : null
        },
        async importDocuments(request) {
          calls.push('importDocuments')
          requests.push(request)
          return operation(
            'operations/import-documents',
            { errorSamples: [] },
            { failureCount: 0, successCount: 7, totalCount: 7 }
          )
        }
      }),
      log(line) {
        calls.push(`log:${line}`)
      }
    }
  )

  assert.deepEqual(
    calls.filter(call => !call.startsWith('log:')),
    [
      'getDataStore',
      'createDataStore',
      'wait:operations/create-data-store',
      'getEngine',
      'createEngine',
      'wait:operations/create-engine',
      'importDocuments',
      'wait:operations/import-documents'
    ]
  )
  assert.equal(result.imported, 7)
  const importRequest = requests[2] as {
    inlineSource: {
      documents: Array<{
        content: { mimeType: string; rawBytes: Uint8Array }
        id: string
        structData: { fields: { uri: { stringValue: string } } }
      }>
    }
    parent: string
    reconciliationMode: string
  }
  assert.equal(importRequest.parent, branchName)
  assert.equal(importRequest.reconciliationMode, 'INCREMENTAL')
  assert.deepEqual(
    importRequest.inlineSource.documents.map(
      document => document.id
    ),
    reviewedIds
  )
  for (const document of importRequest.inlineSource.documents) {
    assert.equal(document.content.mimeType, 'text/plain')
    assert.ok(document.content.rawBytes instanceof Uint8Array)
    assert.equal(
      document.structData.fields.uri.stringValue,
      `https://utekos.no/${document.id}`
    )
  }
})

test('approved apply refuses dedicated resource drift and performs no import', async () => {
  let importCalls = 0

  await assert.rejects(
    runDiscoveryResourceApply(
      ['--apply'],
      {
        ASSISTANT_GCP_APPLY_APPROVAL:
          'approved-utekos-assistant-v1'
      },
      {
        buildDocuments: () => [],
        createClients: () => ({
          async createDataStore() {
            throw new Error('must_not_create')
          },
          async createEngine() {
            throw new Error('must_not_create')
          },
          async getDataStore() {
            return {
              ...matchingDataStore,
              displayName: 'Conflicting'
            }
          },
          async getEngine() {
            return matchingEngine
          },
          async importDocuments() {
            importCalls += 1
            throw new Error('must_not_import')
          }
        }),
        log() {}
      }
    ),
    { message: 'gcp_discovery_data_store_drift' }
  )
  assert.equal(importCalls, 0)
})
