import { z } from 'zod'

import { MICROSOFT_ADS_ENVIRONMENTS } from './config.mjs'
import {
  createMicrosoftAdsApiHeaders,
  requestMicrosoftAdsJson
} from './http.mjs'

const idSchema = z.union([
  z.string().trim().regex(/^\d+$/),
  z
    .number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER)
    .transform(String)
])

const microsoftObjectSchema = z.object({}).passthrough()
const microsoftObjectArraySchema = z
  .array(microsoftObjectSchema)
  .optional()
  .nullable()

const partialErrorsSchema = z
  .array(z.unknown())
  .optional()
  .nullable()

const accountPropertiesResponseSchema = z
  .object({
    AccountProperties: microsoftObjectArraySchema,
    PartialErrors: partialErrorsSchema
  })
  .passthrough()

const uetTagsResponseSchema = z
  .object({
    UetTags: microsoftObjectArraySchema,
    PartialErrors: partialErrorsSchema
  })
  .passthrough()

const conversionGoalsResponseSchema = z
  .object({
    ConversionGoals: microsoftObjectArraySchema,
    PartialErrors: partialErrorsSchema
  })
  .passthrough()

const campaignsResponseSchema = z
  .object({
    Campaigns: microsoftObjectArraySchema,
    PartialErrors: partialErrorsSchema
  })
  .passthrough()

const adGroupsResponseSchema = z
  .object({
    AdGroups: microsoftObjectArraySchema,
    PartialErrors: partialErrorsSchema
  })
  .passthrough()

const adsResponseSchema = z
  .object({
    Ads: microsoftObjectArraySchema,
    PartialErrors: partialErrorsSchema
  })
  .passthrough()

const keywordsResponseSchema = z
  .object({
    Keywords: microsoftObjectArraySchema,
    PartialErrors: partialErrorsSchema
  })
  .passthrough()

const mutationResponseSchema = z
  .object({
    PartialErrors: partialErrorsSchema
  })
  .passthrough()

const addConversionGoalsResponseSchema = mutationResponseSchema.extend({
  ConversionGoalIds: z
    .array(idSchema.nullable())
    .optional()
    .nullable()
})

const addConversionGoalSchema = microsoftObjectSchema.extend({
  Type: z.string().trim().min(1)
})

const updateConversionGoalSchema = addConversionGoalSchema.extend({
  Id: idSchema
})

export function getMicrosoftAdsCampaignManagementBaseUrl(
  environment
) {
  if (environment === MICROSOFT_ADS_ENVIRONMENTS.sandbox) {
    return 'https://campaign.api.sandbox.bingads.microsoft.com/CampaignManagement/v13'
  }

  if (environment === MICROSOFT_ADS_ENVIRONMENTS.production) {
    return 'https://campaign.api.bingads.microsoft.com/CampaignManagement/v13'
  }

  throw new Error(
    `Unsupported Microsoft Advertising environment: ${String(
      environment
    )}`
  )
}

export function createMicrosoftAdsCampaignManagementClient({
  config,
  accessToken,
  fetchImpl = globalThis.fetch,
  timeoutMs = 30_000
}) {
  const environment =
    config?.environment ??
    MICROSOFT_ADS_ENVIRONMENTS.production

  const baseUrl =
    getMicrosoftAdsCampaignManagementBaseUrl(environment)

  async function rawRequest(
    pathname,
    {
      method = 'POST',
      body,
      responseSchema = microsoftObjectSchema,
      customerId = config?.customerId,
      accountId = config?.accountId,
      additionalHeaders,
      signal
    } = {}
  ) {
    const relativePath = normalizeRelativePath(pathname)

    const headers = createMicrosoftAdsApiHeaders({
      config,
      accessToken,
      customerId,
      accountId,
      additionalHeaders
    })

    const raw = await requestMicrosoftAdsJson(
      `${baseUrl}${relativePath}`,
      {
        method,
        headers,
        body,
        fetchImpl,
        timeoutMs,
        signal
      }
    )

    return responseSchema.parse(raw)
  }

  return {
    baseUrl,
    rawRequest,

    getAccountProperties(accountPropertyNames, options = {}) {
      const names = z
        .array(z.string().trim().min(1))
        .min(1)
        .parse(accountPropertyNames)

      return rawRequest('/AccountProperties/Query', {
        ...options,
        body: {
          AccountPropertyNames: names
        },
        responseSchema: accountPropertiesResponseSchema
      })
    },

    getUetTagsByIds(
      tagIds,
      {
        returnAdditionalFields = 'Industry',
        ...options
      } = {}
    ) {
      const ids = parseIds(tagIds, { max: 100 })

      return rawRequest('/UetTags/QueryByIds', {
        ...options,
        body: {
          TagIds: ids,
          ReturnAdditionalFields: returnAdditionalFields
        },
        responseSchema: uetTagsResponseSchema
      })
    },

    getConversionGoalsByTagIds(
      tagIds,
      conversionGoalTypes,
      {
        returnAdditionalFields = null,
        ...options
      } = {}
    ) {
      const ids = parseIds(tagIds, { max: 100 })

      const types = z
        .union([
          z.string().trim().min(1),
          z
            .array(z.string().trim().min(1))
            .min(1)
        ])
        .parse(conversionGoalTypes)

      return rawRequest('/ConversionGoals/QueryByTagIds', {
        ...options,
        body: {
          TagIds: ids,
          ConversionGoalTypes: types,
          ReturnAdditionalFields: returnAdditionalFields
        },
        responseSchema: conversionGoalsResponseSchema
      })
    },

    addConversionGoals(conversionGoals, options = {}) {
      const items = z
        .array(addConversionGoalSchema)
        .min(1)
        .max(100)
        .parse(conversionGoals)

      return rawRequest('/ConversionGoals', {
        ...options,
        method: 'POST',
        body: { ConversionGoals: items },
        responseSchema: addConversionGoalsResponseSchema
      })
    },

    updateConversionGoals(conversionGoals, options = {}) {
      const items = z
        .array(updateConversionGoalSchema)
        .min(1)
        .max(100)
        .parse(conversionGoals)

      return rawRequest('/ConversionGoals', {
        ...options,
        method: 'PUT',
        body: { ConversionGoals: items },
        responseSchema: mutationResponseSchema
      })
    },

    getCampaignsByAccountId({
      campaignType,
      returnAdditionalFields,
      ...options
    } = {}) {
      const accountId = idSchema.parse(
        options.accountId ?? config?.accountId
      )

      return rawRequest('/Campaigns/QueryByAccountId', {
        ...options,
        accountId,
        body: {
          AccountId: accountId,
          ...(campaignType
            ? { CampaignType: campaignType }
            : {}),
          ...(returnAdditionalFields !== undefined
            ? {
                ReturnAdditionalFields:
                  returnAdditionalFields
              }
            : {})
        },
        responseSchema: campaignsResponseSchema
      })
    },

    getAdGroupsByCampaignId(
      campaignId,
      {
        returnAdditionalFields,
        ...options
      } = {}
    ) {
      const resolvedCampaignId = idSchema.parse(campaignId)

      return rawRequest('/AdGroups/QueryByCampaignId', {
        ...options,
        body: {
          CampaignId: resolvedCampaignId,
          ...(returnAdditionalFields !== undefined
            ? {
                ReturnAdditionalFields:
                  returnAdditionalFields
              }
            : {})
        },
        responseSchema: adGroupsResponseSchema
      })
    },

    getAdsByAdGroupId(
      adGroupId,
      {
        adTypes,
        returnAdditionalFields = null,
        ...options
      } = {}
    ) {
      const resolvedAdGroupId = idSchema.parse(adGroupId)

      return rawRequest('/Ads/QueryByAdGroupId', {
        ...options,
        body: {
          AdGroupId: resolvedAdGroupId,
          ...(adTypes
            ? {
                AdTypes: z
                  .array(z.string().trim().min(1))
                  .min(1)
                  .parse(adTypes)
              }
            : {}),
          ReturnAdditionalFields: returnAdditionalFields
        },
        responseSchema: adsResponseSchema
      })
    },

    getKeywordsByAdGroupId(adGroupId, options = {}) {
      const resolvedAdGroupId = idSchema.parse(adGroupId)

      return rawRequest('/Keywords/QueryByAdGroupId', {
        ...options,
        body: {
          AdGroupId: resolvedAdGroupId
        },
        responseSchema: keywordsResponseSchema
      })
    },

    addCampaigns(campaigns, options = {}) {
      const accountId = idSchema.parse(
        options.accountId ?? config?.accountId
      )

      const items = z
        .array(microsoftObjectSchema)
        .min(1)
        .max(100)
        .parse(campaigns)

      return rawRequest('/Campaigns', {
        ...options,
        method: 'POST',
        accountId,
        body: {
          AccountId: accountId,
          Campaigns: items
        },
        responseSchema: mutationResponseSchema
      })
    },

    updateCampaigns(campaigns, options = {}) {
      const accountId = idSchema.parse(
        options.accountId ?? config?.accountId
      )

      const items = z
        .array(microsoftObjectSchema)
        .min(1)
        .max(100)
        .parse(campaigns)

      return rawRequest('/Campaigns', {
        ...options,
        method: 'PUT',
        accountId,
        body: {
          AccountId: accountId,
          Campaigns: items
        },
        responseSchema: mutationResponseSchema
      })
    },

    deleteCampaigns(campaignIds, options = {}) {
      const accountId = idSchema.parse(
        options.accountId ?? config?.accountId
      )

      const ids = parseIds(campaignIds, { max: 100 })

      return rawRequest('/Campaigns', {
        ...options,
        method: 'DELETE',
        accountId,
        body: {
          AccountId: accountId,
          CampaignIds: ids
        },
        responseSchema: mutationResponseSchema
      })
    }
  }
}

function parseIds(values, { max }) {
  return z
    .array(idSchema)
    .min(1)
    .max(max)
    .parse(values)
}

function normalizeRelativePath(pathname) {
  if (
    typeof pathname !== 'string' ||
    !pathname.trim()
  ) {
    throw new TypeError(
      'Campaign Management pathname must be a non-empty string.'
    )
  }

  const path = pathname.trim()

  if (
    /^[a-z][a-z0-9+.-]*:/i.test(path) ||
    path.startsWith('//') ||
    path.includes('..')
  ) {
    throw new Error(
      'Campaign Management requests must use a relative API pathname.'
    )
  }

  return path.startsWith('/')
    ? path
    : `/${path}`
}
