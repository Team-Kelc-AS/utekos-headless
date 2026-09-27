import { getAllProductsForCatalogSync } from '../../src/lib/shopify/admin'
import { getMerchantCenterConfig } from '../../src/lib/google/merchant-center/config'
import { listMerchantDataSources } from '../../src/lib/google/merchant-center/dataSources/listMerchantDataSources'
import { resolveMerchantProductDataSource } from '../../src/lib/google/merchant-center/dataSources/resolveMerchantProductDataSource'
import { getMerchantApiDiagnostic } from '../../src/lib/google/merchant-center/getMerchantApiDiagnostic'
import type { MerchantDataSource } from '../../src/lib/google/merchant-center/merchantCenterTypes'
import { listMerchantProcessedProducts } from '../../src/lib/google/merchant-center/products/listMerchantProcessedProducts'
import { buildMerchantProductInput } from '../../src/lib/google/merchant-center/products/buildMerchantProductInput'

type PayloadSummary = {
  productsScanned: number
  activeProducts: number
  variantsScanned: number
  validInputs: number
  withPrice: number
  withGtins: number
  withItemGroupId: number
  withGoogleProductCategory: number
  withImageLink: number
  withAdditionalImageLinks: number
  withProductTypes: number
  identifierStrategies: Record<string, number>
  skippedReasons: Record<string, number>
  samples: Array<Record<string, unknown>>
}

type ProcessedProductSummary = {
  totalProcessedProducts: number
  managedProducts: number
  sourceCounts: Record<string, number>
  withPrice: number
  missingPrice: number
  priceIssues: Record<string, number>
  withGtins: number
  withItemGroupId: number
  withGoogleProductCategory: number
  withImageLink: number
  withAdditionalImageLinks: number
  withProductTypes: number
  samples: Array<Record<string, unknown>>
}

function incrementCounter(counter: Record<string, number>, key: string) {
  counter[key] = (counter[key] ?? 0) + 1
}

function readStringArrayAttribute(attributes: Record<string, unknown>, key: string) {
  const value = attributes[key]

  return Array.isArray(value) && value.every(item => typeof item === 'string') ? value : []
}

function readStringAttribute(attributes: Record<string, unknown>, key: string) {
  const value = attributes[key]

  return typeof value === 'string' && value.trim() ? value : undefined
}

async function summarizeLocalPayload(): Promise<PayloadSummary> {
  const products = await getAllProductsForCatalogSync()
  const summary: PayloadSummary = {
    productsScanned: products.length,
    activeProducts: 0,
    variantsScanned: 0,
    validInputs: 0,
    withPrice: 0,
    withGtins: 0,
    withItemGroupId: 0,
    withGoogleProductCategory: 0,
    withImageLink: 0,
    withAdditionalImageLinks: 0,
    withProductTypes: 0,
    identifierStrategies: {},
    skippedReasons: {},
    samples: []
  }

  for (const product of products) {
    if (product.status !== 'ACTIVE') {
      continue
    }

    summary.activeProducts += 1

    for (const variantEdge of product.variants.edges) {
      summary.variantsScanned += 1

      const builtInput = buildMerchantProductInput(product, variantEdge.node)

      if (!builtInput.ok) {
        incrementCounter(summary.skippedReasons, builtInput.reason)
        continue
      }

      const attributes = builtInput.input.productAttributes
      const gtins = readStringArrayAttribute(attributes, 'gtins')
      const additionalImageLinks = readStringArrayAttribute(attributes, 'additionalImageLinks')
      const productTypes = readStringArrayAttribute(attributes, 'productTypes')

      summary.validInputs += 1
      incrementCounter(summary.identifierStrategies, builtInput.identifierStrategy)

      if (
        typeof attributes.price === 'object' &&
        attributes.price !== null &&
        'amountMicros' in attributes.price &&
        'currencyCode' in attributes.price
      ) {
        summary.withPrice += 1
      }
      if (gtins.length > 0) summary.withGtins += 1
      if (readStringAttribute(attributes, 'itemGroupId')) summary.withItemGroupId += 1
      if (readStringAttribute(attributes, 'googleProductCategory')) summary.withGoogleProductCategory += 1
      if (readStringAttribute(attributes, 'imageLink')) summary.withImageLink += 1
      if (additionalImageLinks.length > 0) summary.withAdditionalImageLinks += 1
      if (productTypes.length > 0) summary.withProductTypes += 1

      if (summary.samples.length < 8) {
        summary.samples.push({
          offerId: builtInput.offerId,
          product: product.title,
          variant: variantEdge.node.title,
          sku: variantEdge.node.sku,
          gtins,
          itemGroupId: readStringAttribute(attributes, 'itemGroupId'),
          googleProductCategory: readStringAttribute(attributes, 'googleProductCategory'),
          imageLink: readStringAttribute(attributes, 'imageLink'),
          additionalImageLinkCount: additionalImageLinks.length,
          productTypes
        })
      }
    }
  }

  return summary
}

function summarizeDataSource(dataSource: MerchantDataSource) {
  return {
    name: dataSource.name,
    dataSourceId: dataSource.dataSourceId,
    displayName: dataSource.displayName,
    input: dataSource.input,
    primaryProductDataSource: dataSource.primaryProductDataSource,
    supplemental: Boolean(dataSource.supplementalProductDataSource)
  }
}

async function summarizeMerchantApiState() {
  try {
    const [dataSources, resolvedDataSource, processedProducts] = await Promise.all([
      listMerchantDataSources(),
      resolveMerchantProductDataSource(),
      listMerchantProcessedProducts()
    ])
    const managedProducts = processedProducts.filter(
      product => product.dataSource === resolvedDataSource.name
    )
    const processedSummary: ProcessedProductSummary = {
      totalProcessedProducts: processedProducts.length,
      managedProducts: managedProducts.length,
      sourceCounts: {},
      withPrice: 0,
      missingPrice: 0,
      priceIssues: {},
      withGtins: 0,
      withItemGroupId: 0,
      withGoogleProductCategory: 0,
      withImageLink: 0,
      withAdditionalImageLinks: 0,
      withProductTypes: 0,
      samples: []
    }

    for (const product of processedProducts) {
      incrementCounter(
        processedSummary.sourceCounts,
        product.dataSource ?? '<unspecified>'
      )

      if (product.productAttributes?.price) {
        processedSummary.withPrice += 1
      } else {
        processedSummary.missingPrice += 1
      }

      for (const issue of product.productStatus?.itemLevelIssues ?? []) {
        if (issue.attribute?.toLowerCase() === 'price') {
          incrementCounter(
            processedSummary.priceIssues,
            `${issue.code ?? '<no code>'} | ${issue.severity ?? '<no severity>'}`
          )
        }
      }
    }

    for (const product of managedProducts) {
      const attributes = product.productAttributes ?? {}
      const gtins = readStringArrayAttribute(attributes, 'gtins')
      const additionalImageLinks = readStringArrayAttribute(attributes, 'additionalImageLinks')
      const productTypes = readStringArrayAttribute(attributes, 'productTypes')

      if (gtins.length > 0) processedSummary.withGtins += 1
      if (readStringAttribute(attributes, 'itemGroupId')) processedSummary.withItemGroupId += 1
      if (readStringAttribute(attributes, 'googleProductCategory')) processedSummary.withGoogleProductCategory += 1
      if (readStringAttribute(attributes, 'imageLink')) processedSummary.withImageLink += 1
      if (additionalImageLinks.length > 0) processedSummary.withAdditionalImageLinks += 1
      if (productTypes.length > 0) processedSummary.withProductTypes += 1

      if (processedSummary.samples.length < 8) {
        processedSummary.samples.push({
          offerId: product.offerId,
          name: product.name,
          gtins,
          itemGroupId: readStringAttribute(attributes, 'itemGroupId'),
          googleProductCategory: readStringAttribute(attributes, 'googleProductCategory'),
          imageLink: readStringAttribute(attributes, 'imageLink'),
          additionalImageLinkCount: additionalImageLinks.length,
          productTypes
        })
      }
    }

    return {
      ok: true,
      dataSources: dataSources.map(summarizeDataSource),
      resolvedDataSource: summarizeDataSource(resolvedDataSource),
      processedProducts: processedSummary
    }
  } catch (error) {
    return {
      ok: false,
      diagnostic: getMerchantApiDiagnostic(error)
    }
  }
}

async function main() {
  const config = getMerchantCenterConfig()
  const [localPayload, merchantApi] = await Promise.all([
    summarizeLocalPayload(),
    summarizeMerchantApiState()
  ])
  const result = {
    checkedAt: new Date().toISOString(),
    accountId: config.accountId,
    accountName: config.accountName,
    serviceAccountEmail: config.serviceAccount.clientEmail,
    gcpProjectId: config.serviceAccount.projectId ?? null,
    quotaProject: config.quotaProject ?? null,
    useQuotaProjectHeader: config.useQuotaProjectHeader,
    localPayload,
    merchantApi
  }

  console.log(JSON.stringify(result, null, 2))

  if (!merchantApi.ok) {
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
