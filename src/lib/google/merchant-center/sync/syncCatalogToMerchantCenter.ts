import { getAllProductsForCatalogSync } from '@/lib/shopify/admin'

import { getMerchantCenterConfig } from '../config'
import { resolveMerchantProductDataSource } from '../dataSources/resolveMerchantProductDataSource'
import { MerchantCenterApiError } from '../merchantApiRequest'
import type {
  MerchantProcessedProduct,
  MerchantProductIdentifierStrategy,
  MerchantProductInputBuildResult
} from '../merchantCenterTypes'
import { buildMerchantProductInput } from '../products/buildMerchantProductInput'
import { buildMerchantProductInputName } from '../products/buildMerchantProductInputName'
import { deleteMerchantProductInput } from '../products/deleteMerchantProductInput'
import { insertMerchantProductInput } from '../products/insertMerchantProductInput'
import { listMerchantProcessedProducts } from '../products/listMerchantProcessedProducts'
import type { MerchantCatalogSyncLease } from './MerchantCatalogSyncLease'
import { claimMerchantCatalogSyncLease } from './claimMerchantCatalogSyncLease'
import { releaseMerchantCatalogSyncLease } from './releaseMerchantCatalogSyncLease'

type MerchantSyncSkippedReason =
  | 'missing_offer_id'
  | 'missing_item_group_id'
  | 'missing_image_link'
  | 'missing_price'
  | 'missing_product_presentation'
  | 'invalid_variant_presentation'
  | 'hidden_public_variant'

type MerchantCenterSyncSummary = {
  productsScanned: number
  inactiveProductsSkipped: number
  variantsScanned: number
  variantsExcluded: number
  variantsQueued: number
  staleProductsDetected: number
  upserted: number
  deleted: number
  upsertErrors: number
  deleteErrors: number
  identifierStrategies: Record<MerchantProductIdentifierStrategy, number>
  skippedReasons: Record<MerchantSyncSkippedReason, number>
}

type MerchantCenterSyncError = {
  action: 'insert' | 'delete'
  offerId: string
  productInputName?: string
  message: string
  status?: number
  responseBody?: unknown
}

export type MerchantCenterSyncResult = {
  success: boolean
  status: 'completed' | 'already_running'
  dryRun: boolean
  checkedAt: string
  accountId: string
  lease: MerchantCatalogSyncLease
  dataSource: {
    name: string
    displayName?: string
    dataSourceId?: string
  } | null
  summary: MerchantCenterSyncSummary
  preview: {
    queuedOfferIds: string[]
    staleOfferIds: string[]
  }
  errors: MerchantCenterSyncError[]
}

function createSyncSummary(): MerchantCenterSyncSummary {
  return {
    productsScanned: 0,
    inactiveProductsSkipped: 0,
    variantsScanned: 0,
    variantsExcluded: 0,
    variantsQueued: 0,
    staleProductsDetected: 0,
    upserted: 0,
    deleted: 0,
    upsertErrors: 0,
    deleteErrors: 0,
    identifierStrategies: {
      gtin: 0,
      mpn: 0,
      identifier_exists_false: 0,
      brand_only: 0
    },
    skippedReasons: {
      missing_offer_id: 0,
      missing_item_group_id: 0,
      missing_image_link: 0,
      missing_price: 0,
      missing_product_presentation: 0,
      invalid_variant_presentation: 0,
      hidden_public_variant: 0
    }
  }
}

function normalizeSyncError(
  error: unknown,
  context: Omit<MerchantCenterSyncError, 'message' | 'status' | 'responseBody'>
): MerchantCenterSyncError {
  if (error instanceof MerchantCenterApiError) {
    return {
      ...context,
      message: error.message,
      status: error.status,
      responseBody: error.responseBody
    }
  }

  return {
    ...context,
    message: error instanceof Error ? error.message : 'Unexpected Merchant sync error'
  }
}

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<void>
) {
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize)
    await Promise.all(batch.map(worker))
  }
}

function buildStaleProductInputName(product: MerchantProcessedProduct) {
  return buildMerchantProductInputName(
    product.contentLanguage,
    product.feedLabel,
    product.offerId
  )
}

export async function syncCatalogToMerchantCenter(options?: {
  dryRun?: boolean
}): Promise<MerchantCenterSyncResult> {
  const config = getMerchantCenterConfig()
  const dryRun = options?.dryRun ?? false
  const lease = await claimMerchantCatalogSyncLease({
    dryRun,
    accountId: config.accountId
  })

  if (lease.status === 'blocked') {
    return {
      success: false,
      status: 'already_running',
      dryRun,
      checkedAt: new Date().toISOString(),
      accountId: config.accountId,
      lease,
      dataSource: null,
      summary: createSyncSummary(),
      preview: {
        queuedOfferIds: [],
        staleOfferIds: []
      },
      errors: []
    }
  }

  try {
    const dataSource = await resolveMerchantProductDataSource()
    const products = await getAllProductsForCatalogSync()
    const existingProcessedProducts = await listMerchantProcessedProducts()
    const summary = createSyncSummary()
    const errors: MerchantCenterSyncError[] = []
    const queuedInputs: Extract<MerchantProductInputBuildResult, { ok: true }>[] = []
    const desiredOfferIds = new Set<string>()

    for (const product of products) {
      summary.productsScanned += 1

      if (product.status !== 'ACTIVE') {
        summary.inactiveProductsSkipped += 1
        continue
      }

      for (const variantEdge of product.variants.edges) {
        summary.variantsScanned += 1

        const builtInput = buildMerchantProductInput(product, variantEdge.node)

        if (!builtInput.ok) {
          summary.variantsExcluded += 1
          summary.skippedReasons[builtInput.reason] += 1
          continue
        }

        desiredOfferIds.add(builtInput.offerId)
        summary.variantsQueued += 1
        summary.identifierStrategies[builtInput.identifierStrategy] += 1
        queuedInputs.push(builtInput)
      }
    }

    const managedProcessedProducts = existingProcessedProducts.filter(
      product => product.dataSource === dataSource.name
    )
    const staleProcessedProducts = managedProcessedProducts.filter(
      product => !desiredOfferIds.has(product.offerId)
    )

    summary.staleProductsDetected = staleProcessedProducts.length

    if (!dryRun) {
      await runInBatches(queuedInputs, 10, async builtInput => {
        try {
          await insertMerchantProductInput(
            builtInput.input,
            dataSource.name,
            config.accountName
          )
          summary.upserted += 1
        } catch (error) {
          summary.upsertErrors += 1
          errors.push(
            normalizeSyncError(error, {
              action: 'insert',
              offerId: builtInput.offerId
            })
          )
        }
      })

      await runInBatches(staleProcessedProducts, 10, async product => {
        const productInputName = buildStaleProductInputName(product)

        try {
          await deleteMerchantProductInput(productInputName, dataSource.name)
          summary.deleted += 1
        } catch (error) {
          summary.deleteErrors += 1
          errors.push(
            normalizeSyncError(error, {
              action: 'delete',
              offerId: product.offerId,
              productInputName
            })
          )
        }
      })
    }

    return {
      success: errors.length === 0,
      status: 'completed',
      dryRun,
      checkedAt: new Date().toISOString(),
      accountId: config.accountId,
      lease,
      dataSource: {
        name: dataSource.name,
        ...(dataSource.displayName
          ? { displayName: dataSource.displayName }
          : {}),
        ...(dataSource.dataSourceId
          ? { dataSourceId: dataSource.dataSourceId }
          : {})
      },
      summary,
      preview: {
        queuedOfferIds: queuedInputs.slice(0, 25).map(item => item.offerId),
        staleOfferIds: staleProcessedProducts
          .slice(0, 25)
          .map(product => product.offerId)
      },
      errors
    }
  } finally {
    await releaseMerchantCatalogSyncLease(lease)
  }
}
