#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { createMicrosoftAdsAdInsightClient, getLastNDaysDateRange } from './lib/ad-insight.mjs'
import { refreshMicrosoftAdsAccessToken } from './lib/auth.mjs'
import { createMicrosoftAdsCampaignManagementClient } from './lib/campaign-management.mjs'
import {
  getMissingMicrosoftAdsRequirements,
  getSafeMicrosoftAdsConfig,
  loadMicrosoftAdsConfig,
  MICROSOFT_ADS_REPO_ROOT,
  MICROSOFT_UET_CAPI_TOKEN_ENV_KEYS
} from './lib/config.mjs'
import { redactMicrosoftAdsSecrets } from './lib/http.mjs'
import { createMicrosoftAdsReportingClient } from './lib/reporting.mjs'
import {
  createMicrosoftShoppingContentClient,
  summarizeMicrosoftShoppingProducts
} from './lib/shopping-content.mjs'

const auditRequiredFields = [
  'developerToken',
  'clientId',
  'clientSecret',
  'refreshToken',
  'customerId',
  'accountId',
  'uetTagId'
]

const conversionGoalTypes = [
  'AppDownload',
  'AppInstall',
  'Duration',
  'Event',
  'InStoreTransaction',
  'OfflineConversion',
  'PagesViewedPerVisit',
  'Url'
]

const campaignTypes = [
  'App',
  'Audience',
  'DynamicSearchAds',
  'Hotel',
  'PerformanceMax',
  'Search',
  'Shopping'
]

const adTypes = [
  'AppInstall',
  'DynamicSearch',
  'ExpandedText',
  'Hotel',
  'Product',
  'ResponsiveAd',
  'ResponsiveSearch',
  'Text'
]

const accountPropertyNames = [
  'MSCLKIDAutoTaggingEnabled',
  'IncludeViewThroughConversions',
  'IncludeAutoBiddingViewThroughConversions',
  'TrackingUrlTemplate',
  'FinalUrlSuffix',
  'ProfileExpansionEnabled',
  'BusinessAttributes'
]

function isDirectExecution() {
  return Boolean(
    process.argv[1] &&
      path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
  )
}

if (isDirectExecution()) {
  main().catch(error => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: redactMicrosoftAdsSecrets(
            error instanceof Error ? error.message : String(error)
          )
        },
        null,
        2
      )
    )
    process.exitCode = 1
  })
}

async function main() {
  const startedAt = new Date().toISOString()
  const config = loadMicrosoftAdsConfig()
  const missingRequirements = getMissingMicrosoftAdsRequirements(
    config,
    auditRequiredFields
  )

  if (missingRequirements.length > 0) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          startedAt,
          account: getSafeMicrosoftAdsConfig(config),
          missingRequirements
        },
        null,
        2
      )
    )
    process.exitCode = 1
    return
  }

  const result = await collectMicrosoftAdsAccountAudit({ config })
  console.log(JSON.stringify(result, null, 2))

  if (!result.ok) {
    process.exitCode = 1
  }
}

export async function collectMicrosoftAdsAccountAudit({
  config = loadMicrosoftAdsConfig(),
  fetchImpl = globalThis.fetch,
  onRefreshTokenRotated = null,
  clock = () => new Date()
} = {}) {
  const startedAt = normalizeAuditClock(clock).toISOString()
  const missingRequirements = getMissingMicrosoftAdsRequirements(
    config,
    auditRequiredFields
  )

  if (missingRequirements.length > 0) {
    const error = new Error(
      `Missing Microsoft Advertising audit configuration: ${missingRequirements.join(', ')}`
    )
    error.name = 'MicrosoftAdsAuditConfigurationError'
    error.missingRequirements = missingRequirements
    throw error
  }

  if (typeof fetchImpl !== 'function') {
    throw new TypeError('Microsoft Ads account audit fetchImpl must be a function.')
  }

  if (
    onRefreshTokenRotated !== null &&
    typeof onRefreshTokenRotated !== 'function'
  ) {
    throw new TypeError(
      'Microsoft Ads account audit onRefreshTokenRotated must be a function or null.'
    )
  }

  const auth = await refreshMicrosoftAdsAccessToken(config, { fetchImpl })

  if (auth.refreshTokenRotated && auth.refreshToken && onRefreshTokenRotated) {
    await onRefreshTokenRotated(auth.refreshToken)
  }

  const campaignManagement = createMicrosoftAdsCampaignManagementClient({
    config,
    accessToken: auth.accessToken,
    fetchImpl
  })
  const reporting = createMicrosoftAdsReportingClient({
    config,
    accessToken: auth.accessToken,
    fetchImpl
  })
  const adInsight = createMicrosoftAdsAdInsightClient({
    config,
    accessToken: auth.accessToken,
    fetchImpl
  })
  const shopping = createMicrosoftShoppingContentClient({
    config,
    accessToken: auth.accessToken,
    fetchImpl
  })

  const [
    accountPropertiesRead,
    uetTagsRead,
    conversionGoalsRead,
    campaignsRead,
    shoppingRead,
    reportRead,
    adInsightRead
  ] = await Promise.all([
    safeRead('account_properties', () =>
      readAccountProperties(campaignManagement)
    ),
    safeRead('uet_tags', () => readUetTags(config, campaignManagement)),
    safeRead('conversion_goals', () =>
      readConversionGoals(config, campaignManagement)
    ),
    safeRead('campaign_tree', () =>
      readCampaignTree(config, campaignManagement)
    ),
    safeRead('shopping_content', () =>
      readShoppingContent(config, shopping)
    ),
    safeRead('campaign_report', () =>
      reporting.generateCampaignPerformanceReport()
    ),
    safeRead('ad_insight', () => readAdInsight(adInsight))
  ])

  const accountProperties = unwrapRead(accountPropertiesRead)
  const uetTags = unwrapRead(uetTagsRead)
  const conversionGoals = unwrapRead(conversionGoalsRead)
  const campaigns = unwrapRead(campaignsRead)
  const shoppingContent = unwrapRead(shoppingRead)
  const report = unwrapRead(reportRead)
  const adInsightData = unwrapRead(adInsightRead)
  const localImplementation = readLocalImplementation()

  const criticalReads = {
    accountProperties: accountPropertiesRead.ok,
    uetTags: uetTagsRead.ok,
    conversionGoals:
      conversionGoalsRead.ok && conversionGoals?.ok !== false,
    campaigns: campaignsRead.ok && campaigns?.ok !== false,
    reporting: reportRead.ok && report?.ok !== false,
    shoppingContent:
      !config.merchantStoreId ||
      (shoppingRead.ok &&
        shoppingContent?.skipped !== true &&
        shoppingContent?.ok !== false),
    adInsight: adInsightRead.ok && adInsightData?.ok !== false
  }

  const readFailures = [
    accountPropertiesRead,
    uetTagsRead,
    conversionGoalsRead,
    campaignsRead,
    shoppingRead,
    reportRead,
    adInsightRead
  ].filter(read => !read.ok)

  const findings = buildFindings({
    config,
    accountProperties,
    uetTags,
    conversionGoals,
    campaigns,
    shoppingContent,
    report,
    adInsight: adInsightData,
    localImplementation,
    readFailures
  })

  return {
    ok: Object.values(criticalReads).every(Boolean),
    auditVersion: 2,
    startedAt,
    finishedAt: normalizeAuditClock(clock).toISOString(),
    account: getSafeMicrosoftAdsConfig(config),
    credentialReadiness: {
      developerTokenPresent: Boolean(config.developerToken),
      clientIdPresent: Boolean(config.clientId),
      clientSecretPresent: Boolean(config.clientSecret),
      refreshTokenPresent: Boolean(config.refreshToken),
      accessTokenRefreshed: Boolean(auth.accessToken),
      refreshTokenRotated: auth.refreshTokenRotated,
      rotatedRefreshTokenPersistenceRequired: auth.refreshTokenRotated,
      uetCapiTokenPresent: Boolean(config.uetCapiToken),
      uetCapiTokenAliasesChecked: MICROSOFT_UET_CAPI_TOKEN_ENV_KEYS,
      cApiAuthKeyReadSkipped: true,
      cApiAuthKeySkipReason:
        'GetUetTagAuthKey can generate/store a key when none exists, so it is intentionally not called by this account audit.'
    },
    criticalReads,
    accountProperties,
    uetTags,
    conversionGoals,
    campaigns,
    shoppingContent,
    report,
    adInsight: adInsightData,
    localImplementation,
    findings,
    readFailures: readFailures.map(({ name, error }) => ({ name, error })),
    sources: [
      'https://learn.microsoft.com/advertising/guides/authentication-oauth-get-tokens?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getaccountproperties?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getuettagsbyids?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getconversiongoalsbytagids?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getcampaignsbyaccountid?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getadgroupsbycampaignid?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getadsbyadgroupid?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getkeywordsbyadgroupid?view=bingads-13',
      'https://learn.microsoft.com/advertising/reporting-service/submitgeneratereport?pivots=rest',
      'https://learn.microsoft.com/advertising/reporting-service/pollgeneratereport?pivots=rest',
      'https://learn.microsoft.com/advertising/shopping-content/products-resource',
      'https://learn.microsoft.com/advertising/shopping-content/catalogs-resource',
      'https://learn.microsoft.com/advertising/shopping-content/product-offer-statuses',
      'https://learn.microsoft.com/advertising/ad-insight-service/retrieverecommendations?pivots=rest',
      'https://learn.microsoft.com/advertising/ad-insight-service/getperformanceinsightsdetaildatabyaccountid?pivots=rest'
    ]
  }
}

function normalizeAuditClock(clock) {
  if (typeof clock !== 'function') {
    throw new TypeError('Microsoft Ads account audit clock must be a function.')
  }

  const value = clock()
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Microsoft Ads account audit clock returned an invalid date.')
  }

  return date
}

async function readAccountProperties(client) {
  const data = await client.getAccountProperties(accountPropertyNames)
  const properties = (data.AccountProperties ?? [])
    .filter(Boolean)
    .map(property => ({
      name: property.Name ?? null,
      value: property.Value ?? null
    }))

  return {
    requestedNames: accountPropertyNames,
    count: properties.length,
    partialErrors: summarizeErrors(data.PartialErrors),
    properties,
    byName: Object.fromEntries(
      properties
        .filter(property => property.name)
        .map(property => [property.name, property.value])
    )
  }
}

async function readUetTags(config, client) {
  const data = await client.getUetTagsByIds([config.uetTagId], {
    returnAdditionalFields: 'Industry'
  })

  return {
    count: data.UetTags?.length ?? 0,
    partialErrors: summarizeErrors(data.PartialErrors),
    tags: (data.UetTags ?? []).filter(Boolean).map(tag => ({
      id: tag.Id ?? null,
      name: tag.Name ?? null,
      description: tag.Description ?? null,
      trackingStatus: tag.TrackingStatus ?? null,
      industry: tag.Industry ?? null,
      ownerCustomerId: tag.CustomerShare?.OwnerCustomerId ?? null,
      sharedAccountCount:
        tag.CustomerShare?.CustomerAccountShares?.length ?? 0,
      trackingScriptPresent: Boolean(tag.TrackingScript),
      trackingNoScriptPresent: Boolean(tag.TrackingNoScript)
    }))
  }
}

async function readConversionGoals(config, client) {
  const reads = await Promise.all(
    conversionGoalTypes.map(async type => {
      try {
        const data = await client.getConversionGoalsByTagIds(
          [config.uetTagId],
          type,
          {
            returnAdditionalFields: 'InactiveDueToTagUnavailable'
          }
        )

        return {
          type,
          ok: true,
          goals: (data.ConversionGoals ?? []).filter(Boolean),
          partialErrors: summarizeErrors(data.PartialErrors)
        }
      } catch (error) {
        return {
          type,
          ok: false,
          goals: [],
          partialErrors: [],
          error: safeError(error)
        }
      }
    })
  )

  const goalsById = new Map()

  for (const read of reads) {
    for (const goal of read.goals) {
      goalsById.set(String(goal.Id), goal)
    }
  }

  const goals = [...goalsById.values()].map(goal => ({
    id: goal.Id ?? null,
    name: goal.Name ?? null,
    type: goal.Type ?? null,
    derivedType: goal.$type ?? goal.Type ?? null,
    status: goal.Status ?? null,
    trackingStatus: goal.TrackingStatus ?? null,
    tagId: goal.TagId ?? null,
    scope: goal.Scope ?? null,
    countType: goal.CountType ?? null,
    conversionWindowInMinutes: goal.ConversionWindowInMinutes ?? null,
    viewThroughConversionWindowInMinutes:
      goal.ViewThroughConversionWindowInMinutes ?? null,
    revenue: goal.Revenue
      ? {
          currencyCode: goal.Revenue.CurrencyCode ?? null,
          type: goal.Revenue.Type ?? null,
          value: goal.Revenue.Value ?? null
        }
      : null,
    event: {
      categoryExpression: goal.CategoryExpression ?? null,
      categoryOperator: goal.CategoryOperator ?? null,
      actionExpression: goal.ActionExpression ?? null,
      actionOperator: goal.ActionOperator ?? null,
      labelExpression: goal.LabelExpression ?? null,
      labelOperator: goal.LabelOperator ?? null,
      value: goal.Value ?? null,
      valueOperator: goal.ValueOperator ?? null
    },
    isEnhancedConversionsEnabled: goal.IsEnhancedConversionsEnabled ?? null,
    excludeFromBidding: goal.ExcludeFromBidding ?? null
  }))

  return {
    ok: reads.some(read => read.ok),
    apiVisibleTypes: conversionGoalTypes,
    productGoalApiVisibility:
      'Product is not included in the Campaign Management v13 ConversionGoalType value set; inspect product goals with the supported Microsoft surfaces where applicable.',
    reads: reads.map(read => ({
      type: read.type,
      ok: read.ok,
      count: read.goals.length,
      partialErrors: read.partialErrors,
      ...(read.error ? { error: read.error } : {})
    })),
    count: goals.length,
    goals
  }
}

async function readCampaignTree(config, client) {
  const queryAttempts = [
    { mode: 'search_default', campaignType: undefined },
    ...campaignTypes.map(campaignType => ({
      mode: `type_${campaignType}`,
      campaignType
    }))
  ]
  const campaignQueries = []
  const campaignsById = new Map()

  for (const attempt of queryAttempts) {
    try {
      const data = await client.getCampaignsByAccountId({
        campaignType: attempt.campaignType
      })
      const campaigns = data.Campaigns ?? []
      campaignQueries.push({
        mode: attempt.mode,
        ok: true,
        count: campaigns.length,
        partialErrors: summarizeErrors(data.PartialErrors)
      })

      for (const campaign of campaigns) {
        campaignsById.set(String(campaign.Id), campaign)
      }
    } catch (error) {
      campaignQueries.push({
        mode: attempt.mode,
        ok: false,
        count: 0,
        error: safeError(error)
      })
    }
  }

  const campaigns = []

  for (const campaign of campaignsById.values()) {
    let adGroupsData

    try {
      adGroupsData = await client.getAdGroupsByCampaignId(campaign.Id)
    } catch (error) {
      campaigns.push({
        ...normalizeCampaign(campaign),
        adGroups: {
          count: 0,
          error: safeError(error),
          items: []
        }
      })
      continue
    }

    const adGroups = []

    for (const adGroup of adGroupsData.AdGroups ?? []) {
      const [ads, keywords] = await Promise.all([
        readAds(client, adGroup.Id),
        readKeywords(client, adGroup.Id)
      ])

      adGroups.push({
        id: adGroup.Id ?? null,
        name: adGroup.Name ?? null,
        status: adGroup.Status ?? null,
        type: adGroup.AdGroupType ?? null,
        network: adGroup.Network ?? null,
        biddingScheme: adGroup.BiddingScheme?.Type ?? null,
        cpcBid: adGroup.CpcBid?.Amount ?? null,
        ads,
        keywords
      })
    }

    campaigns.push({
      ...normalizeCampaign(campaign),
      adGroups: {
        count: adGroups.length,
        partialErrors: summarizeErrors(adGroupsData.PartialErrors),
        items: adGroups
      }
    })
  }

  return {
    ok: campaignQueries.some(query => query.ok),
    queryAttempts: campaignQueries,
    count: campaigns.length,
    activeCount: campaigns.filter(campaign => campaign.status === 'Active')
      .length,
    campaigns
  }
}

function normalizeCampaign(campaign) {
  return {
    id: campaign.Id ?? null,
    name: campaign.Name ?? null,
    status: campaign.Status ?? null,
    type: campaign.CampaignType ?? null,
    subType: campaign.SubType ?? null,
    budgetType: campaign.BudgetType ?? null,
    dailyBudget: campaign.DailyBudget ?? null,
    bidStrategy: campaign.BiddingScheme?.Type ?? null,
    timeZone: campaign.TimeZone ?? null,
    languages: campaign.Languages ?? [],
    finalUrlSuffix: campaign.FinalUrlSuffix ?? null,
    trackingUrlTemplate: campaign.TrackingUrlTemplate ?? null,
    goalIds: campaign.GoalIds ?? []
  }
}

async function readAds(client, adGroupId) {
  try {
    const data = await client.getAdsByAdGroupId(adGroupId, {
      adTypes,
      returnAdditionalFields: null
    })

    return {
      count: data.Ads?.length ?? 0,
      partialErrors: summarizeErrors(data.PartialErrors),
      items: (data.Ads ?? []).map(ad => ({
        id: ad.Id ?? null,
        type: ad.Type ?? null,
        subType: ad.AdSubType ?? null,
        status: ad.Status ?? null,
        editorialStatus: ad.EditorialStatus ?? null,
        finalUrls: ad.FinalUrls ?? [],
        path1: ad.Path1 ?? null,
        path2: ad.Path2 ?? null,
        businessName: ad.BusinessName ?? null,
        callToAction: ad.CallToAction ?? null,
        title: ad.Title ?? null,
        text: ad.Text ?? null,
        headline: ad.Headline ?? null,
        longHeadline: ad.LongHeadline ?? ad.LongHeadlineString ?? null,
        headlines: readAssetTexts(ad.Headlines),
        longHeadlines: readAssetTexts(ad.LongHeadlines),
        descriptions: readAssetTexts(ad.Descriptions),
        imageCount: ad.Images?.length ?? 0,
        videoCount: ad.Videos?.length ?? 0,
        impressionTrackingUrlCount: ad.ImpressionTrackingUrls?.length ?? 0
      }))
    }
  } catch (error) {
    return {
      count: 0,
      error: safeError(error),
      items: []
    }
  }
}

async function readKeywords(client, adGroupId) {
  try {
    const data = await client.getKeywordsByAdGroupId(adGroupId)
    const keywords = data.Keywords ?? []

    return {
      count: keywords.length,
      inactiveEditorialCount: keywords.filter(
        keyword => keyword.EditorialStatus === 'Inactive'
      ).length,
      partialErrors: summarizeErrors(data.PartialErrors),
      items: keywords.map(keyword => ({
        id: keyword.Id ?? null,
        text: keyword.Text ?? null,
        matchType: keyword.MatchType ?? null,
        status: keyword.Status ?? null,
        editorialStatus: keyword.EditorialStatus ?? null,
        bid: keyword.Bid?.Amount ?? null,
        finalUrls: keyword.FinalUrls ?? []
      }))
    }
  } catch (error) {
    return {
      count: 0,
      inactiveEditorialCount: 0,
      error: safeError(error),
      items: []
    }
  }
}

async function readShoppingContent(config, client) {
  if (!config.merchantStoreId) {
    return {
      ok: false,
      skipped: true,
      reason: 'missing MICROSOFT_MERCHANT_CENTER_STORE_ID'
    }
  }

  if (config.environment === 'sandbox') {
    return {
      ok: false,
      skipped: true,
      reason:
        'Microsoft Shopping Content API has no sandbox endpoint; production credentials are required.'
    }
  }

  const [catalogRead, productsRead, statusSummaryRead, statusesRead] =
    await Promise.all([
      safeOptionalRead('catalogs', () => client.listCatalogs()),
      safeOptionalRead('products', () => client.listAllProducts()),
      safeOptionalRead('product_status_summary_beta', () =>
        client.getProductStatusesSummary()
      ),
      safeOptionalRead('product_statuses_beta', () =>
        client.listAllProductStatuses({ maxPages: 20 })
      )
    ])

  const products = productsRead.ok ? productsRead.value.products : []
  const productSummary = summarizeMicrosoftShoppingProducts(products)
  const statuses = statusesRead.ok ? statusesRead.value.statuses : []

  return {
    ok: catalogRead.ok && productsRead.ok,
    storeId: config.merchantStoreId,
    catalogs: catalogRead.ok
      ? {
          count: catalogRead.value.catalogs.length,
          items: catalogRead.value.catalogs
        }
      : {
          count: 0,
          error: catalogRead.error,
          items: []
        },
    products: {
      ...productSummary,
      pages: productsRead.ok ? productsRead.value.pages : 0,
      truncated: productsRead.ok ? productsRead.value.truncated : false,
      error: productsRead.ok ? null : productsRead.error,
      sample: products.slice(0, 20).map(product => ({
        id: product.id ?? product.offerId ?? null,
        offerId: product.offerId ?? null,
        title: product.title ?? null,
        availability: product.availability ?? null,
        targetCountry: product.targetCountry ?? null,
        contentLanguage: product.contentLanguage ?? null,
        feedLabel: product.feedLabel ?? null,
        link: product.link ?? null
      }))
    },
    productStatuses: {
      availability: 'closed-beta',
      summary: statusSummaryRead.ok ? statusSummaryRead.value : null,
      summaryError: statusSummaryRead.ok ? null : statusSummaryRead.error,
      count: statuses.length,
      disapprovedCount: statuses.filter(
        status => String(status.status).toLowerCase() === 'disapproved'
      ).length,
      warningCount: statuses.filter(
        status => String(status.status).toLowerCase() === 'warning'
      ).length,
      error: statusesRead.ok ? null : statusesRead.error,
      items: statuses.slice(0, 100).map(status => ({
        productId: status.productId ?? null,
        title: status.title ?? null,
        status: status.status ?? null,
        creationDate: status.creationDate ?? null,
        lastUpdateDate: status.lastUpdateDate ?? null,
        expirationDate: status.expirationDate ?? null,
        itemLevelIssues: status.itemLevelIssues ?? []
      }))
    }
  }
}

async function readAdInsight(client) {
  const range = getLastNDaysDateRange(30)
  const [recommendationsRead, performanceInsightsRead] = await Promise.all([
    safeOptionalRead('recommendations', () =>
      client.retrieveRecommendations()
    ),
    safeOptionalRead('performance_insights', () =>
      client.getPerformanceInsightsDetailDataByAccountId({
        entityType: 'Account',
        startDate: range.startDate,
        endDate: range.endDate
      })
    )
  ])

  const recommendations = recommendationsRead.ok
    ? recommendationsRead.value.recommendations
    : []
  const byType = {}

  for (const recommendation of recommendations) {
    const type =
      recommendation.RecommendationType ??
      recommendation.Type ??
      'Unknown'
    byType[type] = (byType[type] ?? 0) + 1
  }

  return {
    ok: recommendationsRead.ok || performanceInsightsRead.ok,
    recommendations: {
      ok: recommendationsRead.ok,
      count: recommendations.length,
      byType,
      error: recommendationsRead.ok ? null : recommendationsRead.error,
      items: recommendations
    },
    performanceInsights: {
      ok: performanceInsightsRead.ok,
      startDate: range.startDate,
      endDate: range.endDate,
      count: performanceInsightsRead.ok
        ? performanceInsightsRead.value.insights.length
        : 0,
      error: performanceInsightsRead.ok
        ? null
        : performanceInsightsRead.error,
      items: performanceInsightsRead.ok
        ? performanceInsightsRead.value.insights
        : []
    }
  }
}

function readLocalImplementation() {
  const eventMap = readProjectSourceFile(
    'src/lib/tracking/events/mapToCanonicalEventName.ts'
  )
  const browserUet = readProjectSourceFile(
    'src/lib/tracking/microsoft-uet/trackMicrosoftUetEvent.ts'
  )
  const uetTag = readProjectSourceFile(
    'src/components/analytics/MicrosoftUetTag.tsx'
  )
  const capiPurchase = readProjectSourceFile(
    'src/lib/tracking/microsoft-uet/sendMicrosoftUetPurchase.ts'
  )
  const capiEventBuilder = readProjectSourceFile(
    'src/lib/tracking/microsoft-uet/buildMicrosoftUetPurchaseEvent.ts'
  )
  const providerQueue = readProjectSourceFile(
    'src/lib/tracking/warehouse/getProvidersForAcceptedTrackingEvent.ts'
  )
  const orderTracking = readProjectSourceFile(
    'src/lib/tracking/services/processOrderTrackingWithDependencies.ts'
  )

  const addToCartAction = eventMap.content.includes(
    "AddToCart: 'add_to_cart'"
  )
    ? 'add_to_cart'
    : 'unknown'
  const beginCheckoutAction = eventMap.content.includes(
    "InitiateCheckout: 'begin_checkout'"
  )
    ? 'begin_checkout'
    : 'unknown'
  const beginCheckoutCompatibilityAction = browserUet.content.includes(
    "eventAction: 'AutoEvent_begin_checkout'"
  )
    ? 'AutoEvent_begin_checkout'
    : 'unknown'
  const purchaseAction = eventMap.content.includes("Purchase: 'purchase'")
    ? 'purchase'
    : 'unknown'
  const productPurchaseCompatibilityAction = browserUet.content.includes(
    "eventAction: 'PRODUCT_PURCHASE'"
  )
    ? 'PRODUCT_PURCHASE'
    : 'unknown'
  const productPurchaseCompatibilityPageType = browserUet.content.includes(
    "pageType: 'PURCHASE'"
  )
    ? 'PURCHASE'
    : 'unknown'
  const productPurchaseHelperEventName = browserUet.content.includes(
    "eventName: 'PRODUCT_PURCHASE'"
  )
    ? 'PRODUCT_PURCHASE'
    : 'unknown'
  const productPurchaseHelperPageType = browserUet.content.includes(
    "pageType: 'PURCHASE'"
  )
    ? 'PURCHASE'
    : 'unknown'
  const inlinePurchaseEventName = uetTag.content.includes(
    "window.uetq.push('event', 'PRODUCT_PURCHASE', payload)"
  )
    ? 'PRODUCT_PURCHASE'
    : 'unknown'
  const inlinePurchasePageType = uetTag.content.includes(
    "ecomm_pagetype: 'PURCHASE'"
  )
    ? 'PURCHASE'
    : 'unknown'
  const serverCapiPurchaseEventName = capiEventBuilder.content.includes(
    "eventName: 'PRODUCT_PURCHASE'"
  )
    ? 'PRODUCT_PURCHASE'
    : 'unknown'
  const serverCapiPageType = capiEventBuilder.content.includes(
    "pageType: 'purchase'"
  )
    ? 'purchase'
    : capiEventBuilder.content.includes("pageType: 'PURCHASE'")
      ? 'PURCHASE'
      : 'unknown'
  const cApiRequiresToken =
    capiPurchase.content.includes('if (!config.apiToken)') &&
    capiPurchase.content.includes("reason: 'missing_capi_token'")
  const cApiRequiresMsclkid =
    capiPurchase.content.includes('getMicrosoftClickId(attribution)') &&
    capiPurchase.content.includes("reason: 'missing_msclkid'")
  const outboundClickLabelScrubbed = uetTag.content.includes(
    'return `${parsed.origin}${parsed.pathname}`'
  )
  const outboundClickEmitterFound = [
    eventMap.content,
    browserUet.content,
    uetTag.content
  ].some(
    content =>
      content.includes('AutoEvent_outbound_click') ||
      content.includes('outbound_click')
  )

  return {
    inspectedFiles: [
      eventMap,
      browserUet,
      uetTag,
      capiPurchase,
      capiEventBuilder,
      providerQueue,
      orderTracking
    ].map(file => ({
      path: file.relativePath,
      exists: file.exists
    })),
    browserEvents: {
      dispatcherPresent: browserUet.content.includes(
        'dispatchMicrosoftUetBrowserEvent'
      ),
      addToCartAction,
      beginCheckoutAction,
      beginCheckoutCompatibilityAction,
      beginCheckoutPageType:
        browserUet.content.includes("case 'begin_checkout'") &&
        browserUet.content.includes("return 'cart'")
          ? 'cart'
          : 'unknown',
      purchaseAction,
      productPurchaseCompatibilityAction,
      productPurchaseCompatibilityPageType,
      productPurchaseHelperEventName,
      productPurchaseHelperPageType,
      queuePushPattern: browserUet.content.includes(
        "getMicrosoftUetQueue().push('event', eventAction, payload)"
      )
        ? "uetq.push('event', action, payload)"
        : 'unknown'
    },
    productPurchaseGoal: {
      documentedEventAction: 'PRODUCT_PURCHASE',
      documentedPageType: 'PURCHASE',
      localHelperEventAction: productPurchaseHelperEventName,
      localHelperPageType: productPurchaseHelperPageType,
      inlineHelperEventAction: inlinePurchaseEventName,
      inlineHelperPageType: inlinePurchasePageType,
      serverCapiEventAction: serverCapiPurchaseEventName,
      serverCapiPageType,
      productIdPayloadPresent:
        browserUet.content.includes('ecomm_prodid') &&
        uetTag.content.includes('ecomm_prodid'),
      cApiEndpointPresent: capiPurchase.content.includes(
        'https://capi.uet.microsoft.com/v1/${config.tagId}/events'
      ),
      cApiRequiresToken,
      cApiRequiresMsclkid
    },
    providerQueue: {
      serverQueueIncludesMicrosoft:
        providerQueue.content.includes("'microsoft'") ||
        providerQueue.content.includes("'microsoft_uet'"),
      serverDirectOrderAuditPresent:
        orderTracking.content.includes("provider: 'microsoft_uet'") &&
        orderTracking.content.includes("dispatchMode: 'server_direct'"),
      skippedPurchaseLogPresent: orderTracking.content.includes(
        'Microsoft UET Purchase Skipped'
      ),
      providerTypeDeclaration: providerQueue.content.includes(
        "export type TrackingProvider = 'meta' | 'google'"
      )
        ? "export type TrackingProvider = 'meta' | 'google'"
        : 'unknown'
    },
    missingEmitters: {
      outboundClick: !outboundClickEmitterFound,
      outboundClickLabelScrubbed
    }
  }
}

function readProjectSourceFile(relativePath) {
  const fullPath = path.join(MICROSOFT_ADS_REPO_ROOT, relativePath)
  return {
    relativePath,
    exists: fs.existsSync(fullPath),
    content: fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : ''
  }
}

function buildFindings({
  config,
  accountProperties,
  uetTags,
  conversionGoals,
  campaigns,
  shoppingContent,
  report,
  adInsight,
  localImplementation,
  readFailures
}) {
  const findings = []
  const reportTotals = report?.totals ?? {}
  const goals = conversionGoals?.goals ?? []
  const campaignItems = campaigns?.campaigns ?? []
  const activeCampaigns = campaignItems.filter(
    campaign => campaign.status === 'Active'
  )
  const activeShoppingCampaigns = activeCampaigns.filter(
    campaign =>
      campaign.type === 'Shopping' || campaign.type === 'PerformanceMax'
  )
  const msclkidAutoTagging =
    accountProperties?.byName?.MSCLKIDAutoTaggingEnabled

  for (const read of readFailures) {
    findings.push({
      severity: 'high',
      code: `READ_FAILURE_${read.name.toUpperCase()}`,
      area: 'diagnostics',
      message: `Microsoft account audit could not read ${read.name}.`,
      evidence: { error: read.error }
    })
  }

  if (
    numberValue(reportTotals.clicks) > 0 &&
    numberValue(reportTotals.allConversionsQualified) === 0
  ) {
    findings.push({
      severity: 'high',
      code: 'CLICKS_WITH_ZERO_CONVERSIONS',
      area: 'conversion_tracking',
      message: `Reporting shows ${reportTotals.clicks} clicks and zero qualified conversions in the selected campaign report window.`,
      evidence: {
        clicks: reportTotals.clicks,
        spend: reportTotals.spend,
        conversionsQualified: reportTotals.conversionsQualified,
        allConversionsQualified: reportTotals.allConversionsQualified
      }
    })
  }

  if (isFalseLike(msclkidAutoTagging)) {
    findings.push({
      severity: 'high',
      code: 'MSCLKID_AUTO_TAGGING_DISABLED',
      area: 'attribution',
      message:
        'MSCLKID auto-tagging is disabled on the Microsoft Advertising account.',
      evidence: { MSCLKIDAutoTaggingEnabled: msclkidAutoTagging }
    })
  }

  if ((uetTags?.count ?? 0) === 0) {
    findings.push({
      severity: 'high',
      code: 'UET_TAG_NOT_FOUND',
      area: 'uet',
      message: 'The configured Microsoft UET tag ID was not returned by Campaign Management.',
      evidence: { configuredUetTagId: config.uetTagId }
    })
  }

  for (const tag of uetTags?.tags ?? []) {
    if (tag.trackingStatus === 'Inactive' || tag.trackingStatus === 'Unverified') {
      findings.push({
        severity: 'high',
        code: `UET_TAG_${String(tag.trackingStatus).toUpperCase()}`,
        area: 'uet',
        entity: { type: 'uet_tag', id: tag.id, name: tag.name },
        message: `UET tag is ${tag.trackingStatus}.`,
        evidence: { trackingStatus: tag.trackingStatus }
      })
    }
  }

  for (const goal of goals) {
    if (
      ['TagUnverified', 'TagInactive', 'InactiveDueToTagUnavailable'].includes(
        goal.trackingStatus
      )
    ) {
      findings.push({
        severity: 'high',
        code: `CONVERSION_GOAL_${String(goal.trackingStatus).toUpperCase()}`,
        area: 'conversion_tracking',
        entity: { type: 'conversion_goal', id: goal.id, name: goal.name },
        message: `Conversion goal '${goal.name}' has tracking status ${goal.trackingStatus}.`,
        evidence: {
          status: goal.status,
          trackingStatus: goal.trackingStatus,
          tagId: goal.tagId
        }
      })
    } else if (
      goal.trackingStatus === 'NoRecentConversions' &&
      numberValue(reportTotals.clicks) > 0
    ) {
      findings.push({
        severity: 'medium',
        code: 'CONVERSION_GOAL_NO_RECENT_CONVERSIONS',
        area: 'conversion_tracking',
        entity: { type: 'conversion_goal', id: goal.id, name: goal.name },
        message: `Conversion goal '${goal.name}' has no recent conversions while the account has recorded ad clicks.`,
        evidence: {
          trackingStatus: goal.trackingStatus,
          reportClicks: reportTotals.clicks
        }
      })
    }
  }

  if (activeCampaigns.length > 0 && goals.length === 0) {
    findings.push({
      severity: 'medium',
      code: 'NO_CONVERSION_GOALS_VISIBLE',
      area: 'conversion_tracking',
      message: 'Active campaigns exist, but no conversion goals were returned for the configured UET tag.',
      evidence: { activeCampaignCount: activeCampaigns.length }
    })
  }

  if (campaignItems.length > 0 && activeCampaigns.length === 0) {
    findings.push({
      severity: 'medium',
      code: 'NO_ACTIVE_CAMPAIGNS',
      area: 'delivery',
      message: 'Campaigns exist, but none are active.',
      evidence: { campaignCount: campaignItems.length }
    })
  }

  if (activeShoppingCampaigns.length > 0) {
    if (!config.merchantStoreId) {
      findings.push({
        severity: 'high',
        code: 'ACTIVE_SHOPPING_WITHOUT_MERCHANT_STORE_ID',
        area: 'merchant_center',
        message:
          'Shopping or Performance Max campaigns are active, but MICROSOFT_MERCHANT_CENTER_STORE_ID is not configured for diagnostics.',
        evidence: {
          campaignIds: activeShoppingCampaigns.map(campaign => campaign.id)
        }
      })
    } else if (shoppingContent?.products?.count === 0) {
      findings.push({
        severity: 'high',
        code: 'ACTIVE_SHOPPING_WITH_ZERO_PRODUCTS',
        area: 'merchant_center',
        message:
          'Shopping or Performance Max campaigns are active, but the Merchant Center product read returned zero products.',
        evidence: {
          storeId: config.merchantStoreId,
          campaignIds: activeShoppingCampaigns.map(campaign => campaign.id)
        }
      })
    } else if (shoppingContent?.products?.inStockCount === 0) {
      findings.push({
        severity: 'high',
        code: 'ACTIVE_SHOPPING_WITH_ZERO_IN_STOCK_PRODUCTS',
        area: 'merchant_center',
        message:
          'Shopping or Performance Max campaigns are active, but no products are currently reported as in stock.',
        evidence: {
          storeId: config.merchantStoreId,
          productCount: shoppingContent?.products?.count ?? 0
        }
      })
    }
  }

  const disapprovedProducts =
    shoppingContent?.productStatuses?.disapprovedCount ?? 0

  if (disapprovedProducts > 0) {
    findings.push({
      severity: 'high',
      code: 'MERCHANT_PRODUCTS_DISAPPROVED',
      area: 'merchant_center',
      message: `${disapprovedProducts} Merchant Center product offers are reported as disapproved.`,
      evidence: {
        disapprovedCount: disapprovedProducts,
        issues: shoppingContent.productStatuses.items
          .filter(
            item => String(item.status).toLowerCase() === 'disapproved'
          )
          .flatMap(item =>
            (item.itemLevelIssues ?? []).map(issue => ({
              productId: item.productId,
              code: issue.code ?? null,
              description: issue.description ?? null,
              servability: issue.servability ?? null
            }))
          )
          .slice(0, 50)
      }
    })
  }

  if (
    localImplementation.providerQueue.providerTypeDeclaration ===
      "export type TrackingProvider = 'meta' | 'google'" ||
    !localImplementation.providerQueue.serverQueueIncludesMicrosoft
  ) {
    findings.push({
      severity: 'high',
      code: 'LOCAL_MICROSOFT_PROVIDER_QUEUE_NOT_CONFIRMED',
      area: 'local_tracking',
      message:
        'The local provider queue scan does not confirm Microsoft as an accepted server retry provider.',
      evidence: localImplementation.providerQueue
    })
  }

  if (
    localImplementation.productPurchaseGoal.cApiEndpointPresent &&
    localImplementation.productPurchaseGoal.cApiRequiresToken &&
    !config.uetCapiToken
  ) {
    findings.push({
      severity: 'high',
      code: 'MICROSOFT_UET_CAPI_TOKEN_MISSING',
      area: 'local_tracking',
      message:
        'The local Microsoft UET CAPI purchase path requires a token, but no supported UET CAPI token environment variable is present.',
      evidence: {
        aliasesChecked: MICROSOFT_UET_CAPI_TOKEN_ENV_KEYS
      }
    })
  }

  const outboundGoal = goals.find(goal =>
    String(goal.name ?? '').toLowerCase().includes('utgående klikk')
  )

  if (outboundGoal && localImplementation.missingEmitters.outboundClick) {
    findings.push({
      severity: 'medium',
      code: 'OUTBOUND_CLICK_GOAL_WITHOUT_LOCAL_EMITTER',
      area: 'local_tracking',
      entity: {
        type: 'conversion_goal',
        id: outboundGoal.id,
        name: outboundGoal.name
      },
      message:
        'A Microsoft outbound-click conversion goal is visible, but the inspected local Microsoft UET surfaces do not contain an outbound-click emitter.',
      evidence: localImplementation.missingEmitters
    })
  }

  const recommendationCount = adInsight?.recommendations?.count ?? 0

  if (recommendationCount > 0) {
    findings.push({
      severity: 'info',
      code: 'MICROSOFT_RECOMMENDATIONS_AVAILABLE',
      area: 'optimization',
      message: `${recommendationCount} Microsoft Advertising recommendations are currently available for evaluation.`,
      evidence: {
        byType: adInsight.recommendations.byType
      }
    })
  }

  return findings.sort(compareFindingSeverity)
}

async function safeRead(name, operation) {
  try {
    return {
      name,
      ok: true,
      value: await operation(),
      error: null
    }
  } catch (error) {
    return {
      name,
      ok: false,
      value: null,
      error: safeError(error)
    }
  }
}

async function safeOptionalRead(name, operation) {
  try {
    return {
      name,
      ok: true,
      value: await operation(),
      error: null
    }
  } catch (error) {
    return {
      name,
      ok: false,
      value: null,
      error: safeError(error)
    }
  }
}

function unwrapRead(read) {
  if (read.ok) {
    return read.value
  }

  return {
    ok: false,
    error: read.error
  }
}

function safeError(error) {
  return redactMicrosoftAdsSecrets(
    error instanceof Error ? error.message : String(error)
  )
}

function summarizeErrors(errors) {
  return (errors ?? []).map(error => ({
    code: error.Code ?? null,
    errorCode: error.ErrorCode ?? null,
    message: error.Message ?? null,
    fieldPath: error.FieldPath ?? null,
    index: error.Index ?? null
  }))
}

function readAssetTexts(items) {
  return (items ?? [])
    .map(item => item?.Asset?.Text ?? item?.Asset?.Name ?? item?.Text ?? null)
    .filter(Boolean)
}

function numberValue(value) {
  return Number(String(value ?? '').replaceAll(',', '')) || 0
}

function isFalseLike(value) {
  if (value === false || value === 0) {
    return true
  }

  return ['false', '0', 'disabled', 'no'].includes(
    String(value ?? '')
      .trim()
      .toLowerCase()
  )
}

function compareFindingSeverity(left, right) {
  const order = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4
  }

  return (order[left.severity] ?? 99) - (order[right.severity] ?? 99)
}
