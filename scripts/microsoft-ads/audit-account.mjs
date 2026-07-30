#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const campaignApiBase = 'https://campaign.api.bingads.microsoft.com/CampaignManagement/v13'
const reportingApiBase = 'https://reporting.api.bingads.microsoft.com/Reporting/v13'

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

const reportColumns = [
  'AccountName',
  'AccountNumber',
  'AccountId',
  'CampaignName',
  'CampaignId',
  'CampaignStatus',
  'CampaignType',
  'CurrencyCode',
  'Impressions',
  'Clicks',
  'Spend',
  'ConversionsQualified',
  'AllConversionsQualified',
  'Revenue',
  'AllRevenue',
  'Goal',
  'GoalType'
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

main().catch(error => {
  console.error(JSON.stringify({
    ok: false,
    error: redact(String(error?.message ?? error))
  }, null, 2))
  process.exit(1)
})

async function main() {
  const config = getMicrosoftAdsConfig()
  const missing = getMissingRequirements(config)
  const startedAt = new Date().toISOString()

  if (missing.length > 0) {
    console.log(JSON.stringify({
      ok: false,
      startedAt,
      account: safeAccountFields(config),
      missingRequirements: missing
    }, null, 2))
    process.exit(1)
  }

  const accessToken = await refreshAccessToken(config)
  const headers = getMicrosoftAdsHeaders(config, accessToken)
  const [accountProperties, uetTags, conversionGoals, campaigns, shoppingProducts, report] = await Promise.all([
    readAccountProperties(headers),
    readUetTags(config, headers),
    readConversionGoals(config, headers),
    readCampaignTree(config, headers),
    readShoppingProducts(config, accessToken),
    readCampaignReport(config, headers)
  ])
  const localImplementation = readLocalImplementation()

  const result = {
    ok: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    account: safeAccountFields(config),
    credentialReadiness: {
      developerTokenPresent: Boolean(config.developerToken),
      clientIdPresent: Boolean(config.clientId),
      clientSecretPresent: Boolean(config.clientSecret),
      refreshTokenPresent: Boolean(config.refreshToken),
      uetCapiTokenPresent: Boolean(config.uetCapiToken),
      uetCapiTokenAliasesChecked: [
        'MICROSOFT_UET_CAPI_ACCESS_TOKEN',
        'MICROSOFT_UET_CAPI_TOKEN',
        'UTEKOS_MICROSOFT_UET_CAPI_TOKEN',
        'MICROSOFT_ADS_UET_CAPI_TOKEN'
      ],
      cApiAuthKeyReadSkipped: true,
      cApiAuthKeySkipReason: 'GetUetTagAuthKey can generate/store a key when none exists, so it is intentionally not called by this read-only audit.'
    },
    accountProperties,
    uetTags,
    conversionGoals,
    campaigns,
    shoppingProducts,
    report,
    localImplementation,
    findings: buildFindings({
      config,
      accountProperties,
      conversionGoals,
      campaigns,
      report,
      localImplementation
    }),
    sources: [
      'https://learn.microsoft.com/advertising/campaign-management-service/getuettagsbyids?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getconversiongoalsbytagids?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getcampaignsbyaccountid?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getadgroupsbycampaignid?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getadsbyadgroupid?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getkeywordsbyadgroupid?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/getaccountproperties?view=bingads-13',
      'https://learn.microsoft.com/advertising/campaign-management-service/accountpropertyname?view=bingads-13',
      'https://learn.microsoft.com/advertising/reporting-service/submitgeneratereport?view=bingads-13',
      'https://learn.microsoft.com/advertising/reporting-service/pollgeneratereport?view=bingads-13',
      'https://learn.microsoft.com/en-us/advertising/msa-help/hlp_ba_conc_uetv2productgoal'
    ]
  }

  console.log(JSON.stringify(result, null, 2))
}

function readProjectSourceFile(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  return {
    relativePath,
    exists: fs.existsSync(fullPath),
    content: fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : ''
  }
}

function readLocalImplementation() {
  const eventMap = readProjectSourceFile('src/lib/tracking/events/mapToCanonicalEventName.ts')
  const browserUet = readProjectSourceFile('src/lib/tracking/microsoft-uet/trackMicrosoftUetEvent.ts')
  const uetTag = readProjectSourceFile('src/components/analytics/MicrosoftUetTag.tsx')
  const capiPurchase = readProjectSourceFile('src/lib/tracking/microsoft-uet/sendMicrosoftUetPurchase.ts')
  const capiEventBuilder = readProjectSourceFile('src/lib/tracking/microsoft-uet/buildMicrosoftUetPurchaseEvent.ts')
  const providerQueue = readProjectSourceFile('src/lib/tracking/warehouse/getProvidersForAcceptedTrackingEvent.ts')
  const orderTracking = readProjectSourceFile('src/lib/tracking/services/processOrderTrackingWithDependencies.ts')

  const addToCartAction = eventMap.content.includes('AddToCart: \'add_to_cart\'') ? 'add_to_cart' : 'unknown'
  const beginCheckoutAction = eventMap.content.includes('InitiateCheckout: \'begin_checkout\'') ? 'begin_checkout' : 'unknown'
  const beginCheckoutCompatibilityAction = browserUet.content.includes('eventAction: \'AutoEvent_begin_checkout\'') ? 'AutoEvent_begin_checkout' : 'unknown'
  const purchaseAction = eventMap.content.includes('Purchase: \'purchase\'') ? 'purchase' : 'unknown'
  const productPurchaseCompatibilityAction = browserUet.content.includes('eventAction: \'PRODUCT_PURCHASE\'') ? 'PRODUCT_PURCHASE' : 'unknown'
  const productPurchaseCompatibilityPageType = browserUet.content.includes('pageType: \'PURCHASE\'') ? 'PURCHASE' : 'unknown'
  const productPurchaseHelperEventName = browserUet.content.includes('eventName: \'PRODUCT_PURCHASE\'') ? 'PRODUCT_PURCHASE' : 'unknown'
  const productPurchaseHelperPageType = browserUet.content.includes('pageType: \'PURCHASE\'') ? 'PURCHASE' : 'unknown'
  const inlinePurchaseEventName = uetTag.content.includes('window.uetq.push(\'event\', \'PRODUCT_PURCHASE\', payload)') ? 'PRODUCT_PURCHASE' : 'unknown'
  const inlinePurchasePageType = uetTag.content.includes('ecomm_pagetype: \'PURCHASE\'') ? 'PURCHASE' : 'unknown'
  const serverCapiPurchaseEventName = capiEventBuilder.content.includes('eventName: \'PRODUCT_PURCHASE\'') ? 'PRODUCT_PURCHASE' : 'unknown'
  const serverCapiPurchasePageType = capiEventBuilder.content.includes('pageType: \'purchase\'') ? 'purchase' : 'unknown'
  const cApiRequiresToken = capiPurchase.content.includes('if (!config.apiToken)') && capiPurchase.content.includes('reason: \'missing_capi_token\'')
  const cApiRequiresMsclkid = capiPurchase.content.includes('getMicrosoftClickId(attribution)') && capiPurchase.content.includes('reason: \'missing_msclkid\'')
  const outboundClickLabelScrubbed = uetTag.content.includes('return `${parsed.origin}${parsed.pathname}`')
  const outboundClickEmitterFound = [
    eventMap.content,
    browserUet.content,
    uetTag.content
  ].some(content => content.includes('AutoEvent_outbound_click') || content.includes('outbound_click'))

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
      dispatcherPresent: browserUet.content.includes('dispatchMicrosoftUetBrowserEvent'),
      addToCartAction,
      beginCheckoutAction,
      beginCheckoutCompatibilityAction,
      beginCheckoutPageType: browserUet.content.includes('case \'begin_checkout\'') && browserUet.content.includes('return \'cart\'') ? 'cart' : 'unknown',
      purchaseAction,
      productPurchaseCompatibilityAction,
      productPurchaseCompatibilityPageType,
      productPurchaseHelperEventName,
      productPurchaseHelperPageType,
      queuePushPattern: browserUet.content.includes('getMicrosoftUetQueue().push(\'event\', eventAction, payload)') ? 'uetq.push(\'event\', action, payload)' : 'unknown'
    },
    productPurchaseGoal: {
      documentedEventAction: 'PRODUCT_PURCHASE',
      documentedPageType: 'PURCHASE',
      localHelperEventAction: productPurchaseHelperEventName,
      localHelperPageType: productPurchaseHelperPageType,
      inlineHelperEventAction: inlinePurchaseEventName,
      inlineHelperPageType: inlinePurchasePageType,
      serverCapiEventAction: serverCapiPurchaseEventName,
      serverCapiPageType: serverCapiPurchasePageType,
      productIdPayloadPresent: browserUet.content.includes('ecomm_prodid') && uetTag.content.includes('ecomm_prodid'),
      cApiEndpointPresent: capiPurchase.content.includes('https://capi.uet.microsoft.com/v1/${config.tagId}/events'),
      cApiRequiresToken,
      cApiRequiresMsclkid
    },
    providerQueue: {
      serverQueueIncludesMicrosoft: providerQueue.content.includes('\'microsoft\'') || providerQueue.content.includes('\'microsoft_uet\''),
      serverDirectOrderAuditPresent: orderTracking.content.includes('provider: \'microsoft_uet\'') && orderTracking.content.includes('dispatchMode: \'server_direct\''),
      skippedPurchaseLogPresent: orderTracking.content.includes('Microsoft UET Purchase Skipped'),
      providerTypeDeclaration: providerQueue.content.includes('export type TrackingProvider = \'meta\' | \'google\'')
        ? 'export type TrackingProvider = \'meta\' | \'google\''
        : 'unknown'
    },
    missingEmitters: {
      outboundClick: !outboundClickEmitterFound,
      outboundClickLabelScrubbed
    }
  }
}

function readEnvFile(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) return new Map()

  const values = new Map()
  for (const line of fs.readFileSync(fullPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1)
    }
    values.set(match[1], value)
  }
  return values
}

function envValue(key) {
  if (process.env[key]) return process.env[key]
  for (const file of ['.env.mcp.local', '.env.local']) {
    const value = readEnvFile(file).get(key)
    if (value) return value
  }
  return ''
}

function normalizeId(value) {
  return value.trim().replaceAll('-', '')
}

function getMicrosoftAdsConfig() {
  return {
    environment: envValue('MICROSOFT_ADS_ENVIRONMENT') === 'sandbox' ? 'sandbox' : 'production',
    developerToken: envValue('MICROSOFT_ADS_DEVELOPER_TOKEN'),
    clientId: envValue('MICROSOFT_ADS_CLIENT_ID'),
    clientSecret: envValue('MICROSOFT_ADS_CLIENT_SECRET'),
    refreshToken: envValue('MICROSOFT_ADS_REFRESH_TOKEN'),
    customerId: normalizeOptionalId(envValue('MICROSOFT_ADS_CUSTOMER_ID')),
    accountId: normalizeOptionalId(envValue('MICROSOFT_ADS_ACCOUNT_ID')),
    merchantStoreId: normalizeOptionalId(envValue('MICROSOFT_MERCHANT_CENTER_STORE_ID')),
    uetTagId: normalizeOptionalId(envValue('MICROSOFT_UET_TAG_ID') || envValue('NEXT_PUBLIC_MICROSOFT_UET_TAG_ID') || '97247724'),
    uetCapiToken:
      envValue('MICROSOFT_UET_CAPI_ACCESS_TOKEN')
      || envValue('MICROSOFT_UET_CAPI_TOKEN')
      || envValue('UTEKOS_MICROSOFT_UET_CAPI_TOKEN')
      || envValue('MICROSOFT_ADS_UET_CAPI_TOKEN')
  }
}

function normalizeOptionalId(value) {
  return value ? normalizeId(value) : ''
}

function safeAccountFields(config) {
  return {
    environment: config.environment,
    customerId: config.customerId || null,
    accountId: config.accountId || null,
    merchantStoreId: config.merchantStoreId || null,
    uetTagId: config.uetTagId || null
  }
}

function getMissingRequirements(config) {
  const missing = []
  if (!config.developerToken) missing.push('MICROSOFT_ADS_DEVELOPER_TOKEN')
  if (!config.clientId) missing.push('MICROSOFT_ADS_CLIENT_ID')
  if (!config.clientSecret) missing.push('MICROSOFT_ADS_CLIENT_SECRET')
  if (!config.refreshToken) missing.push('MICROSOFT_ADS_REFRESH_TOKEN')
  if (!config.customerId) missing.push('MICROSOFT_ADS_CUSTOMER_ID')
  if (!config.accountId) missing.push('MICROSOFT_ADS_ACCOUNT_ID')
  if (!config.uetTagId) missing.push('MICROSOFT_UET_TAG_ID|NEXT_PUBLIC_MICROSOFT_UET_TAG_ID')
  return missing
}

async function readAccountProperties(headers) {
  const data = await campaignPost('/AccountProperties/Query', headers, {
    AccountPropertyNames: accountPropertyNames
  })

  const properties = (data.AccountProperties ?? []).filter(Boolean).map(property => ({
    name: property.Name ?? null,
    value: property.Value ?? null
  }))

  return {
    requestedNames: accountPropertyNames,
    count: properties.length,
    partialErrors: summarizeErrors(data.PartialErrors),
    properties,
    byName: Object.fromEntries(properties.map(property => [property.name, property.value]))
  }
}

async function refreshAccessToken(config) {
  const data = await jsonFetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
      scope: 'https://ads.microsoft.com/msads.manage offline_access'
    })
  })

  if (typeof data.access_token !== 'string') {
    throw new Error('Microsoft OAuth refresh response did not include access_token.')
  }
  return data.access_token
}

function getMicrosoftAdsHeaders(config, accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    DeveloperToken: config.developerToken,
    CustomerId: config.customerId,
    CustomerAccountId: config.accountId,
    'Content-Type': 'application/json'
  }
}

async function readUetTags(config, headers) {
  const data = await campaignPost('/UetTags/QueryByIds', headers, {
    TagIds: [config.uetTagId],
    ReturnAdditionalFields: 'Industry'
  })
  return {
    count: data.UetTags?.length ?? 0,
    partialErrors: summarizeErrors(data.PartialErrors),
    tags: (data.UetTags ?? []).filter(Boolean).map(tag => ({
      id: tag.Id,
      name: tag.Name,
      description: tag.Description,
      trackingStatus: tag.TrackingStatus,
      industry: tag.Industry,
      ownerCustomerId: tag.CustomerShare?.OwnerCustomerId ?? null,
      sharedAccountCount: tag.CustomerShare?.CustomerAccountShares?.length ?? 0,
      trackingScriptPresent: Boolean(tag.TrackingScript),
      trackingNoScriptPresent: Boolean(tag.TrackingNoScript)
    }))
  }
}

async function readConversionGoals(config, headers) {
  const reads = await Promise.all(conversionGoalTypes.map(async type => {
    try {
      const data = await campaignPost('/ConversionGoals/QueryByTagIds', headers, {
        TagIds: [config.uetTagId],
        ConversionGoalTypes: type,
        ReturnAdditionalFields: null
      })
      const goals = (data.ConversionGoals ?? []).filter(Boolean)
      return {
        type,
        ok: true,
        goals,
        partialErrors: summarizeErrors(data.PartialErrors)
      }
    } catch (error) {
      return {
        type,
        ok: false,
        goals: [],
        partialErrors: [],
        error: redact(error.message)
      }
    }
  }))
  const goalsById = new Map()
  for (const read of reads) {
    for (const goal of read.goals) {
      goalsById.set(String(goal.Id), goal)
    }
  }
  const goals = [...goalsById.values()].map(goal => ({
    id: goal.Id,
    name: goal.Name,
    type: goal.Type,
    derivedType: goal.$type ?? goal.Type,
    status: goal.Status,
    trackingStatus: goal.TrackingStatus,
    tagId: goal.TagId,
    scope: goal.Scope,
    countType: goal.CountType,
    conversionWindowInMinutes: goal.ConversionWindowInMinutes,
    viewThroughConversionWindowInMinutes: goal.ViewThroughConversionWindowInMinutes,
    revenue: goal.Revenue ? {
      currencyCode: goal.Revenue.CurrencyCode,
      type: goal.Revenue.Type,
      value: goal.Revenue.Value
    } : null,
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
    apiVisibleTypes: conversionGoalTypes,
    productGoalApiVisibility: 'Product is not included in the Campaign Management v13 ConversionGoalType value set; inspect Product goals in UI or product-goal docs.',
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

async function readCampaignTree(config, headers) {
  const queryAttempts = [
    { mode: 'search_default', body: { AccountId: config.accountId } },
    ...campaignTypes.map(type => ({
      mode: `type_${type}`,
      body: { AccountId: config.accountId, CampaignType: type }
    }))
  ]
  const campaignQueries = []
  const campaignsById = new Map()

  for (const attempt of queryAttempts) {
    try {
      const data = await campaignPost('/Campaigns/QueryByAccountId', headers, attempt.body)
      const campaigns = data.Campaigns ?? []
      campaignQueries.push({ mode: attempt.mode, ok: true, count: campaigns.length })
      for (const campaign of campaigns) {
        campaignsById.set(String(campaign.Id), campaign)
      }
    } catch (error) {
      campaignQueries.push({ mode: attempt.mode, ok: false, error: redact(error.message) })
    }
  }

  const campaigns = []
  for (const campaign of campaignsById.values()) {
    const adGroupsData = await campaignPost('/AdGroups/QueryByCampaignId', headers, {
      CampaignId: String(campaign.Id)
    })
    const adGroups = []
    for (const adGroup of adGroupsData.AdGroups ?? []) {
      const [ads, keywords] = await Promise.all([
        readAds(headers, adGroup.Id),
        readKeywords(headers, adGroup.Id)
      ])
      adGroups.push({
        id: adGroup.Id,
        name: adGroup.Name,
        status: adGroup.Status,
        type: adGroup.AdGroupType,
        network: adGroup.Network,
        biddingScheme: adGroup.BiddingScheme?.Type ?? null,
        cpcBid: adGroup.CpcBid?.Amount ?? null,
        ads,
        keywords
      })
    }

    campaigns.push({
      id: campaign.Id,
      name: campaign.Name,
      status: campaign.Status,
      type: campaign.CampaignType,
      subType: campaign.SubType ?? null,
      budgetType: campaign.BudgetType,
      dailyBudget: campaign.DailyBudget,
      bidStrategy: campaign.BiddingScheme?.Type ?? null,
      timeZone: campaign.TimeZone,
      languages: campaign.Languages ?? [],
      finalUrlSuffix: campaign.FinalUrlSuffix ?? null,
      trackingUrlTemplate: campaign.TrackingUrlTemplate ?? null,
      goalIds: campaign.GoalIds ?? [],
      adGroups
    })
  }

  return {
    queryAttempts: campaignQueries,
    count: campaigns.length,
    activeCount: campaigns.filter(campaign => campaign.status === 'Active').length,
    campaigns
  }
}

async function readAds(headers, adGroupId) {
  try {
    const data = await campaignPost('/Ads/QueryByAdGroupId', headers, {
      AdGroupId: String(adGroupId),
      AdTypes: adTypes,
      ReturnAdditionalFields: null
    })
    return {
      count: data.Ads?.length ?? 0,
      items: (data.Ads ?? []).map(ad => ({
        id: ad.Id,
        type: ad.Type,
        subType: ad.AdSubType ?? null,
        status: ad.Status,
        editorialStatus: ad.EditorialStatus,
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
    return { count: 0, error: redact(error.message), items: [] }
  }
}

async function readKeywords(headers, adGroupId) {
  try {
    const data = await campaignPost('/Keywords/QueryByAdGroupId', headers, {
      AdGroupId: String(adGroupId)
    })
    return {
      count: data.Keywords?.length ?? 0,
      inactiveEditorialCount: (data.Keywords ?? []).filter(keyword => keyword.EditorialStatus === 'Inactive').length,
      items: (data.Keywords ?? []).map(keyword => ({
        id: keyword.Id,
        text: keyword.Text,
        matchType: keyword.MatchType,
        status: keyword.Status,
        editorialStatus: keyword.EditorialStatus,
        bid: keyword.Bid?.Amount ?? null,
        finalUrls: keyword.FinalUrls ?? []
      }))
    }
  } catch (error) {
    return { count: 0, inactiveEditorialCount: 0, error: redact(error.message), items: [] }
  }
}

async function readShoppingProducts(config, accessToken) {
  if (!config.merchantStoreId) {
    return {
      ok: false,
      skipped: true,
      reason: 'missing MICROSOFT_MERCHANT_CENTER_STORE_ID'
    }
  }

  const url = new URL(`https://content.api.bingads.microsoft.com/shopping/v9.1/bmc/${encodeURIComponent(config.merchantStoreId)}/products`)
  url.searchParams.set('max-results', '50')
  const data = await jsonFetch(url.toString(), {
    method: 'GET',
    headers: {
      AuthenticationToken: accessToken,
      DeveloperToken: config.developerToken,
      CustomerId: config.customerId,
      CustomerAccountId: config.accountId,
      Accept: 'application/json'
    }
  })
  const resources = data.resources ?? data.entries ?? data.items ?? []
  return {
    ok: true,
    storeId: config.merchantStoreId,
    count: resources.length,
    inStockCount: resources.filter(product => getProductAvailability(product) === 'in stock').length,
    outOfStockCount: resources.filter(product => getProductAvailability(product) === 'out of stock').length,
    sample: resources.slice(0, 20).map(product => ({
      id: product.offerId ?? product.id ?? null,
      title: product.title ?? null,
      availability: getProductAvailability(product),
      link: product.link ?? null
    }))
  }
}

async function readCampaignReport(config, headers) {
  const submit = await jsonFetch(`${reportingApiBase}/GenerateReport/Submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ReportRequest: {
        ExcludeColumnHeaders: false,
        ExcludeReportFooter: true,
        ExcludeReportHeader: true,
        Format: 'Csv',
        FormatVersion: '2.0',
        ReportName: `utekos-microsoft-ads-account-audit-${Date.now()}`,
        ReturnOnlyCompleteData: false,
        Type: 'CampaignPerformanceReportRequest',
        Aggregation: 'Summary',
        Columns: reportColumns,
        Scope: { AccountIds: [config.accountId] },
        Time: { PredefinedTime: 'Last30Days', ReportTimeZone: 'BrusselsCopenhagenMadridParis' }
      }
    })
  })
  const reportRequestId = submit.ReportRequestId
  if (!reportRequestId) throw new Error('Microsoft Reporting submit response did not include ReportRequestId.')

  let status = null
  for (let index = 0; index < 18; index += 1) {
    const poll = await jsonFetch(`${reportingApiBase}/GenerateReport/Poll`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ReportRequestId: reportRequestId })
    })
    status = poll.ReportRequestStatus
    if (status?.Status === 'Success') break
    if (status?.Status === 'Error') throw new Error(`Microsoft report generation failed: ${JSON.stringify(status)}`)
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  if (status?.Status !== 'Success' || !status.ReportDownloadUrl) {
    return {
      ok: false,
      reportRequestId,
      status
    }
  }

  const rows = parseReportCsv(await downloadReportCsv(status.ReportDownloadUrl))
  return {
    ok: true,
    reportRequestId,
    rowCount: rows.length,
    totals: summarizeReportRows(rows),
    rows: rows.slice(0, 25)
  }
}

async function campaignPost(pathname, headers, body) {
  return jsonFetch(`${campaignApiBase}${pathname}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
}

async function jsonFetch(url, options) {
  const response = await fetch(url, options)
  const text = await response.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text.slice(0, 1000) }
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${redact(JSON.stringify(data))}`)
  }
  return data
}

async function downloadReportCsv(downloadUrl) {
  const response = await fetch(downloadUrl)
  if (!response.ok) throw new Error(`Microsoft report download failed with HTTP ${response.status}.`)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) return buffer.toString('utf8')

  const zipPath = path.join(os.tmpdir(), `utekos-msads-${Date.now()}.zip`)
  fs.writeFileSync(zipPath, buffer)
  try {
    return execFileSync('unzip', ['-p', zipPath], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024
    })
  } finally {
    fs.rmSync(zipPath, { force: true })
  }
}

function parseReportCsv(csv) {
  const lines = csv.split(/\r?\n/).filter(line => line.trim())
  if (lines.length === 0) return []
  const header = parseCsvLine(lines[0]).map(name => name.replace(/^\uFEFF/, ''))
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line)
    return Object.fromEntries(header.map((key, index) => [key, values[index] ?? '']))
  })
}

function parseCsvLine(line) {
  const values = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        current += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  values.push(current)
  return values
}

function summarizeReportRows(rows) {
  return rows.reduce((totals, row) => {
    totals.impressions += numberValue(row.Impressions)
    totals.clicks += numberValue(row.Clicks)
    totals.spend += numberValue(row.Spend)
    totals.conversionsQualified += numberValue(row.ConversionsQualified)
    totals.allConversionsQualified += numberValue(row.AllConversionsQualified)
    totals.revenue += numberValue(row.Revenue)
    totals.allRevenue += numberValue(row.AllRevenue)
    return totals
  }, {
    impressions: 0,
    clicks: 0,
    spend: 0,
    conversionsQualified: 0,
    allConversionsQualified: 0,
    revenue: 0,
    allRevenue: 0
  })
}

function numberValue(value) {
  return Number(String(value ?? '').replaceAll(',', '')) || 0
}

function readAssetTexts(items) {
  return (items ?? [])
    .map(item => item?.Asset?.Text ?? item?.Asset?.Name ?? item?.Text ?? null)
    .filter(Boolean)
}

function getProductAvailability(product) {
  return String(product.availability ?? product.product?.availability ?? '').toLowerCase()
}

function summarizeErrors(errors) {
  return (errors ?? []).map(error => ({
    code: error.Code ?? null,
    errorCode: error.ErrorCode ?? null,
    message: error.Message ?? null,
    fieldPath: error.FieldPath ?? null
  }))
}

function buildFindings({ config, accountProperties, conversionGoals, campaigns, report, localImplementation }) {
  const findings = []
  const goals = conversionGoals.goals ?? []
  const reportTotals = report.totals ?? {}
  const activeCampaigns = (campaigns.campaigns ?? []).filter(campaign => campaign.status === 'Active')
  const activeShoppingCampaigns = activeCampaigns.filter(campaign => campaign.type === 'Shopping' || campaign.type === 'PerformanceMax')
  const addToCartGoal = goals.find(goal => goal.name === 'Add To Cart')
  const checkoutGoal = goals.find(goal => goal.name === 'Auto Created Goal - Begynn utsjekking')
  const outboundGoal = goals.find(goal => goal.name === 'Auto Created Goal - Utgående klikk')
  const msclkidAutoTagging = accountProperties.byName?.MSCLKIDAutoTaggingEnabled

  if (reportTotals.clicks > 0 && reportTotals.allConversionsQualified === 0) {
    findings.push({
      severity: 'high',
      code: 'CLICKS_WITH_ZERO_CONVERSIONS',
      message: `Reporting API shows ${reportTotals.clicks} clicks and zero qualified conversions in the last 30 days.`
    })
  }

  for (const campaign of activeCampaigns) {
    if (campaign.bidStrategy === 'MaxConversions' && reportTotals.allConversionsQualified === 0) {
      findings.push({
        severity: 'high',
        code: 'MAX_CONVERSIONS_WITH_NO_CONVERSION_SIGNAL',
        message: `Active campaign ${campaign.id} uses MaxConversions while Microsoft Ads has zero qualified conversions.`
      })
    }
  }

  if (!config.uetCapiToken) {
    findings.push({
      severity: 'high',
      code: 'MISSING_UET_CAPI_TOKEN',
      message: 'No Microsoft UET CAPI token alias is present locally, so server-side purchase dispatch cannot run.'
    })
  }

  if (msclkidAutoTagging === 'false') {
    findings.push({
      severity: 'high',
      code: 'MSCLKID_AUTO_TAGGING_DISABLED',
      message: 'Microsoft account property MSCLKIDAutoTaggingEnabled is false; Microsoft click attribution will not be appended to landing-page URLs.'
    })
  }

  if (msclkidAutoTagging === 'true' && !config.uetCapiToken) {
    findings.push({
      severity: 'medium',
      code: 'MSCLKID_ENABLED_BUT_SERVER_PURCHASE_STILL_NEEDS_ATTRIBUTION_CAPTURE',
      message: 'MSCLKID auto-tagging is enabled at account level, but Vercel runtime logs must still prove msclkid is captured into checkout attribution before UET CAPI purchases can attribute.'
    })
  }

  if (activeShoppingCampaigns.length === 0) {
    findings.push({
      severity: 'medium',
      code: 'NO_ACTIVE_FEED_BASED_CAMPAIGN_FOR_PRODUCT_GOAL',
      message: 'No active Shopping or Performance Max campaign is visible through Campaign Management; Microsoft product conversion goals are intended for feed-based campaigns.'
    })
  }

  if (addToCartGoal && addToCartGoal.event.actionExpression !== localImplementation.browserEvents.addToCartAction) {
    findings.push({
      severity: 'high',
      code: 'ADD_TO_CART_ACTION_MISMATCH',
      message: `Add To Cart goal expects ${addToCartGoal.event.actionExpression}; local UET browser mapping sends ${localImplementation.browserEvents.addToCartAction}.`
    })
  }

  if (
    checkoutGoal
    && ![
      localImplementation.browserEvents.beginCheckoutAction,
      localImplementation.browserEvents.beginCheckoutCompatibilityAction
    ].includes(checkoutGoal.event.actionExpression)
  ) {
    findings.push({
      severity: 'high',
      code: 'BEGIN_CHECKOUT_AUTO_GOAL_ACTION_MISMATCH',
      message: `Begin checkout auto goal expects ${checkoutGoal.event.actionExpression}; local UET browser mapping sends ${localImplementation.browserEvents.beginCheckoutAction}.`
    })
  }

  if (outboundGoal && localImplementation.missingEmitters.outboundClick) {
    findings.push({
      severity: 'medium',
      code: 'OUTBOUND_CLICK_GOAL_REQUIRES_BROWSER_EMITTER',
      message: `Outbound click goal expects ${outboundGoal.event.actionExpression}; no matching local browser emitter was found in the inspected UET files.`
    })
  }

  if (
    localImplementation.productPurchaseGoal.localHelperEventAction !== localImplementation.productPurchaseGoal.documentedEventAction
    || localImplementation.productPurchaseGoal.localHelperPageType !== localImplementation.productPurchaseGoal.documentedPageType
    || localImplementation.productPurchaseGoal.serverCapiEventAction !== localImplementation.productPurchaseGoal.documentedEventAction
    || localImplementation.productPurchaseGoal.serverCapiPageType !== 'purchase'
  ) {
    findings.push({
      severity: 'medium',
      code: 'PRODUCT_PURCHASE_PAYLOAD_DIFFERS_FROM_MICROSOFT_DOC_EXAMPLE',
      message: `Microsoft product-goal docs use event action ${localImplementation.productPurchaseGoal.documentedEventAction} and page type ${localImplementation.productPurchaseGoal.documentedPageType}; local browser helper sends ${localImplementation.productPurchaseGoal.localHelperEventAction}/${localImplementation.productPurchaseGoal.localHelperPageType}, and server CAPI sends ${localImplementation.productPurchaseGoal.serverCapiEventAction}/${localImplementation.productPurchaseGoal.serverCapiPageType}.`
    })
  }

  if (outboundGoal && !localImplementation.missingEmitters.outboundClickLabelScrubbed) {
    findings.push({
      severity: 'low',
      code: 'OUTBOUND_CLICK_LABEL_NOT_SCRUBBED',
      message: 'Outbound click emitter should avoid forwarding query strings or hash fragments as the Microsoft event label.'
    })
  }

  if (!localImplementation.providerQueue.serverQueueIncludesMicrosoft) {
    findings.push({
      severity: 'medium',
      code: 'MICROSOFT_BROWSER_EVENTS_NOT_IN_SERVER_PROVIDER_QUEUE',
      message: 'The canonical browser-event provider queue currently declares Meta and Google only; Microsoft UET AddToCart/checkout browser events are not represented as server provider dispatch rows.'
    })
  }

  if (!goals.some(goal => goal.name === 'Purchase')) {
    findings.push({
      severity: 'medium',
      code: 'PRODUCT_PURCHASE_GOAL_NOT_VISIBLE_IN_CAMPAIGN_API',
      message: 'Purchase product goal is not visible through Campaign Management v13 ConversionGoalType; use UI or product-goal-specific verification for that goal.'
    })
  }

  return findings
}

function redact(value) {
  return String(value)
    .replace(/[A-Za-z0-9_=-]{80,}/g, '[redacted]')
    .replace(/Bearer\s+[^\s"]+/g, 'Bearer [redacted]')
}
