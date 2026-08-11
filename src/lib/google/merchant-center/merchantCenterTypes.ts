import { z } from 'zod'

export const merchantDataSourceSchema = z
  .object({
    name: z.string(),
    dataSourceId: z.string().optional(),
    displayName: z.string().optional(),
    input: z.string().optional(),
    primaryProductDataSource: z
      .object({
        countries: z.array(z.string()).optional(),
        feedLabel: z.string().optional(),
        contentLanguage: z.string().optional()
      })
      .partial()
      .optional(),
    supplementalProductDataSource: z.unknown().optional()
  })
  .loose()

export const merchantListDataSourcesResponseSchema = z
  .object({
    dataSources: z.array(merchantDataSourceSchema).optional(),
    nextPageToken: z.string().optional()
  })
  .loose()

export const merchantCreatedDataSourceSchema = merchantDataSourceSchema

export const merchantInsertedProductInputSchema = z
  .object({
    name: z.string(),
    product: z.string().optional(),
    offerId: z.string(),
    contentLanguage: z.string(),
    feedLabel: z.string()
  })
  .loose()

export const merchantProductItemLevelIssueSchema = z
  .object({
    code: z.string().optional(),
    severity: z.string().optional(),
    attribute: z.string().optional(),
    description: z.string().optional(),
    detail: z.string().optional(),
    documentation: z.string().optional(),
    applicableCountries: z.array(z.string()).optional()
  })
  .loose()

export const merchantProcessedProductSchema = z
  .object({
    name: z.string(),
    offerId: z.string(),
    contentLanguage: z.string(),
    feedLabel: z.string(),
    dataSource: z.string().optional(),
    productAttributes: z
      .object({
        title: z.string().optional(),
        link: z.string().optional(),
        canonicalLink: z.string().optional(),
        imageLink: z.string().optional()
      })
      .partial()
      .loose()
      .optional(),
    productStatus: z
      .object({
        destinationStatuses: z
          .array(
            z
              .object({
                reportingContext: z.string().optional(),
                approvedCountries: z.array(z.string()).optional(),
                pendingCountries: z.array(z.string()).optional(),
                disapprovedCountries: z.array(z.string()).optional()
              })
              .loose()
          )
          .optional(),
        itemLevelIssues: z.array(merchantProductItemLevelIssueSchema).optional(),
        creationDate: z.string().optional(),
        lastUpdateDate: z.string().optional(),
        googleExpirationDate: z.string().optional()
      })
      .loose()
      .optional()
  })
  .loose()

export const merchantListProcessedProductsResponseSchema = z
  .object({
    products: z.array(merchantProcessedProductSchema).optional(),
    nextPageToken: z.string().optional()
  })
  .loose()

export const merchantAggregateProductStatusSchema = z
  .object({
    name: z.string(),
    reportingContext: z.string().optional(),
    country: z.string().optional(),
    countryCode: z.string().optional(),
    stats: z
      .object({
        approvedCount: z.string().optional(),
        pendingCount: z.string().optional(),
        disapprovedCount: z.string().optional()
      })
      .loose()
      .optional(),
    statistics: z
      .object({
        approvedCount: z.string().optional(),
        pendingCount: z.string().optional(),
        disapprovedCount: z.string().optional()
      })
      .loose()
      .optional(),
    itemLevelIssues: z
      .array(
        z
          .object({
            issueType: z.string().optional(),
            severity: z.string().optional(),
            numProducts: z.string().optional(),
            sampleProducts: z.array(z.string()).optional()
          })
          .loose()
      )
      .optional(),
    issues: z
      .array(
        z
          .object({
            issueType: z.string().optional(),
            severity: z.string().optional(),
            numProducts: z.string().optional(),
            sampleProducts: z.array(z.string()).optional()
          })
          .loose()
      )
      .optional()
  })
  .loose()

export const merchantListAggregateProductStatusesResponseSchema = z
  .object({
    aggregateProductStatuses: z.array(merchantAggregateProductStatusSchema).optional(),
    nextPageToken: z.string().optional()
  })
  .loose()

export const merchantAccountIssueSchema = z
  .object({
    name: z.string(),
    title: z.string().optional(),
    severity: z.string().optional(),
    detail: z.string().optional(),
    documentationUri: z.string().optional(),
    impactedDestinations: z
      .array(
        z
          .object({
            reportingContext: z.string().optional(),
            impacts: z
              .array(
                z
                  .object({
                    regionCode: z.string().optional(),
                    severity: z.string().optional()
                  })
                  .loose()
              )
              .optional()
          })
          .loose()
      )
      .optional()
  })
  .loose()

export const merchantListAccountIssuesResponseSchema = z
  .object({
    accountIssues: z.array(merchantAccountIssueSchema).optional(),
    nextPageToken: z.string().optional()
  })
  .loose()

export type MerchantDataSource = z.infer<typeof merchantDataSourceSchema>
export type MerchantProcessedProduct = z.infer<typeof merchantProcessedProductSchema>
export type MerchantAggregateProductStatus = z.infer<typeof merchantAggregateProductStatusSchema>
export type MerchantAccountIssue = z.infer<typeof merchantAccountIssueSchema>

export type MerchantProductInputPayload = {
  offerId: string
  contentLanguage: string
  feedLabel: string
  productAttributes: Record<string, unknown>
}

export type MerchantProductIdentifierStrategy = 'gtin' | 'mpn' | 'identifier_exists_false' | 'brand_only'

export type MerchantProductInputBuildResult =
  | {
      ok: true
      offerId: string
      itemGroupId: string
      identifierStrategy: MerchantProductIdentifierStrategy
      input: MerchantProductInputPayload
      productLink: string
    }
  | {
      ok: false
      reason:
        | 'missing_offer_id'
        | 'missing_item_group_id'
        | 'missing_image_link'
        | 'missing_price'
        | 'missing_product_presentation'
        | 'invalid_variant_presentation'
        | 'hidden_public_variant'
    }
