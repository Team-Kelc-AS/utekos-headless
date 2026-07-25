import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { protos, v2 } from '@google-cloud/retail'
import { OAuth2Client } from 'google-auth-library'
import {
  fetchShopifyRetailCatalog,
  type RetailCatalogSnapshot
} from './retail-catalog'

const PROJECT_NUMBER = '741353863697'
const CATALOG_ID = 'default_catalog'
const BRANCH_ID = 'default_branch'
const MODEL_ID = 'utekos-similar-items-v1'
const SERVING_CONFIG_ID = 'utekos-similar-items-v1'
const MINIMUM_SIMILAR_ITEMS_VARIANTS = 100
const CATALOG_APPROVAL = 'approved-utekos-retail-v1'
const MODEL_APPROVAL = 'approved-utekos-similar-items-v1'

type Environment = Readonly<Record<string, string | undefined>>

type Operation = {
  name?: string | null
  promise(): Promise<readonly [unknown, unknown?, unknown?]>
}

type ModelSnapshot = {
  displayName?: string | null
  name?: string | null
  servingState?: string | number | null
  type?: string | null
}

type ServingConfigSnapshot = {
  displayName?: string | null
  modelId?: string | null
  name?: string | null
  solutionTypes?: readonly (string | number)[] | null
}

export type RetailApplyClients = {
  createModel(
    request: protos.google.cloud.retail.v2.ICreateModelRequest
  ): Promise<Operation>
  createServingConfig(
    request: protos.google.cloud.retail.v2.ICreateServingConfigRequest
  ): Promise<ServingConfigSnapshot>
  importProducts(
    request: protos.google.cloud.retail.v2.IImportProductsRequest
  ): Promise<Operation>
  listModels(): Promise<readonly ModelSnapshot[]>
  listProducts(): Promise<readonly string[]>
  listServingConfigs(): Promise<readonly ServingConfigSnapshot[]>
}

export type RetailApplyDependencies = {
  buildCatalog: () => Promise<RetailCatalogSnapshot>
  createClients: (accessToken: string) => RetailApplyClients
  log: (line: string) => void
}

export const retailResourceNames = {
  branch: `projects/${PROJECT_NUMBER}/locations/global/catalogs/${CATALOG_ID}/branches/${BRANCH_ID}`,
  catalog: `projects/${PROJECT_NUMBER}/locations/global/catalogs/${CATALOG_ID}`,
  model: `projects/${PROJECT_NUMBER}/locations/global/catalogs/${CATALOG_ID}/models/${MODEL_ID}`,
  servingConfig: `projects/${PROJECT_NUMBER}/locations/global/catalogs/${CATALOG_ID}/servingConfigs/${SERVING_CONFIG_ID}`
} as const

function requiredValue(environment: Environment, name: string) {
  const value = environment[name]?.trim()
  if (!value)
    throw new Error(`gcp_retail_missing_${name.toLowerCase()}`)
  return value
}

function assertCatalogApplyGate(
  argv: readonly string[],
  environment: Environment
) {
  if (
    !argv.includes('--apply-catalog') ||
    environment.ASSISTANT_GCP_RETAIL_CATALOG_APPROVAL !==
      CATALOG_APPROVAL
  ) {
    throw new Error(
      'gcp_retail_catalog_requires_explicit_approval'
    )
  }
}

function assertModelApplyGate(
  argv: readonly string[],
  environment: Environment
) {
  if (
    !argv.includes('--apply-model') ||
    environment.ASSISTANT_GCP_RETAIL_MODEL_APPROVAL !==
      MODEL_APPROVAL
  ) {
    throw new Error(
      'gcp_retail_model_requires_explicit_approval'
    )
  }
}

function operationName(operation: Operation) {
  return operation.name?.trim() || 'operation_name_unavailable'
}

function countValue(value: unknown) {
  if (
    typeof value === 'number' ||
    typeof value === 'string' ||
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
      response.errorSamples
        .slice(0, 3)
        .map(sample => ({
          code:
            (
              typeof sample === 'object' &&
              sample !== null &&
              'code' in sample
            ) ?
              String(sample.code)
            : 'unknown'
        }))
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

function modelId(model: ModelSnapshot) {
  return model.name?.split('/').at(-1) ?? ''
}

function isDesiredModel(model: ModelSnapshot) {
  return (
    model.name === retailResourceNames.model &&
    model.displayName === 'Utekos Similar Items v1' &&
    model.type === 'similar-items'
  )
}

function isActiveModel(model: ModelSnapshot) {
  return (
    model.servingState === 'ACTIVE' || model.servingState === 1
  )
}

function isDesiredServingConfig(config: ServingConfigSnapshot) {
  const recommendation =
    config.solutionTypes?.includes(
      'SOLUTION_TYPE_RECOMMENDATION'
    ) || config.solutionTypes?.includes(2)

  return (
    config.name === retailResourceNames.servingConfig &&
    config.displayName === 'Utekos Similar Items v1' &&
    config.modelId === MODEL_ID &&
    recommendation === true
  )
}

export function planSimilarItemsResources(
  variantCount: number,
  models: readonly ModelSnapshot[],
  servingConfigs: readonly ServingConfigSnapshot[]
) {
  if (variantCount < MINIMUM_SIMILAR_ITEMS_VARIANTS) {
    return {
      action: 'blocked_minimum_variants' as const,
      minimum: MINIMUM_SIMILAR_ITEMS_VARIANTS,
      variantCount
    }
  }

  const similarItemsModels = models.filter(
    model => model.type === 'similar-items'
  )
  const desiredModel = models.find(
    model => model.name === retailResourceNames.model
  )

  if (
    similarItemsModels.some(
      model => modelId(model) !== MODEL_ID
    ) ||
    (desiredModel && !isDesiredModel(desiredModel))
  ) {
    throw new Error('gcp_retail_similar_items_model_drift')
  }

  const desiredConfig = servingConfigs.find(
    config => config.name === retailResourceNames.servingConfig
  )
  if (desiredConfig && !isDesiredServingConfig(desiredConfig)) {
    throw new Error(
      'gcp_retail_similar_items_serving_config_drift'
    )
  }

  if (!desiredModel) return { action: 'create_model' as const }
  if (!isActiveModel(desiredModel)) {
    return { action: 'wait_for_active_model' as const }
  }
  if (!desiredConfig) {
    return { action: 'create_serving_config' as const }
  }

  return { action: 'ready' as const }
}

export function createRetailApplyClients(
  accessToken: string
): RetailApplyClients {
  const authClient = new OAuth2Client()
  authClient.setCredentials({ access_token: accessToken })
  type RetailClientOptions = NonNullable<
    ConstructorParameters<typeof v2.ProductServiceClient>[0]
  >
  const options = {
    authClient,
    projectId: PROJECT_NUMBER
  } as unknown as RetailClientOptions
  const productClient = new v2.ProductServiceClient(options)
  const modelClient = new v2.ModelServiceClient(options)
  const servingConfigClient = new v2.ServingConfigServiceClient(
    options
  )

  return {
    async createModel(request) {
      const [operation] = await modelClient.createModel(request)
      return operation
    },
    async createServingConfig(request) {
      const [config] =
        await servingConfigClient.createServingConfig(request)
      return config
    },
    async importProducts(request) {
      const [operation] =
        await productClient.importProducts(request)
      return operation
    },
    async listModels() {
      const [models] = await modelClient.listModels({
        parent: retailResourceNames.catalog
      })
      return models
    },
    async listProducts() {
      const [products] = await productClient.listProducts({
        parent: retailResourceNames.branch
      })
      return products.flatMap(product =>
        product.id ? [product.id] : []
      )
    },
    async listServingConfigs() {
      const [configs] =
        await servingConfigClient.listServingConfigs({
          parent: retailResourceNames.catalog
        })
      return configs
    }
  }
}

const defaultDependencies: RetailApplyDependencies = {
  buildCatalog: fetchShopifyRetailCatalog,
  createClients: createRetailApplyClients,
  log: console.log
}

export async function runRetailResourceApply(
  argv: readonly string[] = process.argv.slice(2),
  environment: Environment = process.env,
  dependencies: RetailApplyDependencies = defaultDependencies
) {
  assertCatalogApplyGate(argv, environment)

  const accessToken = requiredValue(
    environment,
    'GCP_RETAIL_ACCESS_TOKEN'
  )
  const catalog = await dependencies.buildCatalog()
  if (!catalog.primaryProductCount || !catalog.variantCount) {
    throw new Error('gcp_retail_catalog_empty')
  }

  const clients = dependencies.createClients(accessToken)
  const importOperation = await clients.importProducts({
    inputConfig: {
      productInlineSource: { products: catalog.products }
    },
    parent: retailResourceNames.branch,
    reconciliationMode: 'INCREMENTAL'
  })
  const [importResult, importMetadata] =
    await importOperation.promise()
  const summary = importSummary(importResult, importMetadata)

  if (
    summary.failureCount !== '0' ||
    summary.errorSamples.length
  ) {
    throw new Error('gcp_retail_catalog_import_failed')
  }

  const importedIds = new Set(await clients.listProducts())
  const expectedIds = catalog.products.flatMap(product =>
    product.id ? [product.id] : []
  )
  if (expectedIds.some(id => !importedIds.has(id))) {
    throw new Error('gcp_retail_catalog_verification_failed')
  }

  dependencies.log(
    JSON.stringify({
      operation: operationName(importOperation),
      primaryProducts: catalog.primaryProductCount,
      resource: retailResourceNames.branch,
      retailProducts: expectedIds.length,
      variants: catalog.variantCount,
      ...summary
    })
  )

  const models = await clients.listModels()
  const servingConfigs = await clients.listServingConfigs()
  const plan = planSimilarItemsResources(
    catalog.variantCount,
    models,
    servingConfigs
  )

  if (plan.action === 'blocked_minimum_variants') {
    dependencies.log(JSON.stringify(plan))
    return { catalog, model: plan, summary }
  }

  assertModelApplyGate(argv, environment)

  if (plan.action === 'create_model') {
    const operation = await clients.createModel({
      model: {
        displayName: 'Utekos Similar Items v1',
        name: retailResourceNames.model,
        trainingState: 'TRAINING',
        type: 'similar-items'
      },
      parent: retailResourceNames.catalog
    })
    await operation.promise()
    dependencies.log(
      JSON.stringify({
        action: 'model_created',
        operation: operationName(operation),
        resource: retailResourceNames.model
      })
    )
    return {
      catalog,
      model: { action: 'wait_for_active_model' as const },
      summary
    }
  }

  if (plan.action === 'create_serving_config') {
    await clients.createServingConfig({
      parent: retailResourceNames.catalog,
      servingConfig: {
        displayName: 'Utekos Similar Items v1',
        modelId: MODEL_ID,
        solutionTypes: [
          protos.google.cloud.retail.v2.SolutionType
            .SOLUTION_TYPE_RECOMMENDATION
        ]
      },
      servingConfigId: SERVING_CONFIG_ID
    })
    dependencies.log(
      JSON.stringify({
        action: 'serving_config_created',
        resource: retailResourceNames.servingConfig
      })
    )
    return {
      catalog,
      model: { action: 'ready' as const },
      summary
    }
  }

  dependencies.log(JSON.stringify(plan))
  return { catalog, model: plan, summary }
}

function safeApplyError(error: unknown) {
  if (
    error instanceof Error &&
    error.message.startsWith('gcp_retail_')
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
    return `gcp_retail_apply_failed:${String(error.code)}`
  }
  return 'gcp_retail_apply_failed'
}

const invokedPath =
  process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  void runRetailResourceApply().catch(error => {
    console.error(safeApplyError(error))
    process.exitCode = 1
  })
}
