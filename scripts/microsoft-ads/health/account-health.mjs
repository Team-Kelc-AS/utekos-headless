import {
  createMicrosoftAdsHealthFinding,
  createMicrosoftAdsHealthResult
} from './finding-schema.mjs'

const REPORTING_DOC =
  'https://learn.microsoft.com/advertising/guides/report-types?view=bingads-13'
const PERFORMANCE_INSIGHTS_DOC =
  'https://learn.microsoft.com/advertising/ad-insight-service/getperformanceinsightsdetaildatabyaccountid?view=bingads-13'
const RECOMMENDATIONS_DOC =
  'https://learn.microsoft.com/advertising/ad-insight-service/retrieverecommendations?view=bingads-13'

const CAMPAIGN_TYPES_EXPECTING_AD_GROUPS = new Set([
  'Audience',
  'DynamicSearchAds',
  'Search',
  'Shopping'
])

export function analyzeMicrosoftAdsAccountHealth(audit) {
  const findings = []
  const campaigns = audit?.campaigns
  const report = audit?.report
  const adInsight = audit?.adInsight
  const readFailures = Array.isArray(audit?.readFailures)
    ? audit.readFailures
    : []

  for (const failure of readFailures) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'high',
        code: `READ_FAILURE_${sanitizeCode(failure?.name ?? 'UNKNOWN')}`,
        area: 'diagnostics',
        title: 'Microsoft Ads read failed',
        summary: `The account health scan could not read ${failure?.name ?? 'an expected Microsoft Ads surface'}.`,
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: failure?.error ?? 'Microsoft Ads read failed.',
          rationale:
            'The health engine cannot consider this surface verified until the read succeeds.'
        },
        evidence: [
          {
            source: 'audit.readFailures',
            key: failure?.name ?? 'unknown',
            value: failure?.error ?? null
          }
        ],
        remediation: {
          summary: 'Resolve the failed Microsoft Ads read before relying on account-wide health conclusions.',
          backend: 'unknown',
          operation: null,
          steps: [
            'Inspect the returned Microsoft error and TrackingId if available.',
            'Verify credentials, account/customer IDs, API availability, and the specific request contract.',
            'Re-run the failed read and then re-run account health.'
          ]
        },
        verification: [
          'The previously failed read returns successfully.',
          'The next account health scan no longer reports this read failure.'
        ],
        sourceDocs: []
      })
    )
  }

  const campaignItems = Array.isArray(campaigns?.campaigns)
    ? campaigns.campaigns
    : []
  const activeCampaigns = campaignItems.filter(isActive)
  const reportTotals = report?.totals ?? {}

  if (campaigns?.ok === false) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'high',
        code: 'CAMPAIGN_TREE_UNAVAILABLE',
        area: 'delivery',
        title: 'Campaign structure unavailable',
        summary:
          'The campaign tree could not be loaded, so delivery structure cannot be fully evaluated.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: campaigns?.error ?? 'Campaign read failed.'
        },
        evidence: [
          {
            source: 'audit.campaigns',
            key: 'error',
            value: campaigns?.error ?? null
          }
        ],
        remediation: {
          summary: 'Restore Campaign Management read access.',
          backend: 'campaign-management',
          operation: 'getCampaignsByAccountId',
          steps: [
            'Resolve the Campaign Management request failure.',
            'Re-read campaigns, ad groups, ads, and keywords.',
            'Re-run account health.'
          ]
        },
        verification: ['Campaign tree read succeeds and returns a structured campaign result.'],
        sourceDocs: []
      })
    )
  } else if (campaignItems.length === 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'info',
        code: 'NO_CAMPAIGNS_FOUND',
        area: 'delivery',
        title: 'No campaigns found',
        summary: 'No campaigns were returned for the advertiser account.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: null
        },
        evidence: [
          {
            source: 'audit.campaigns',
            key: 'count',
            value: 0
          }
        ],
        remediation: {
          summary: 'No remediation is required if this account is intentionally empty.',
          backend: 'campaign-management',
          operation: null,
          steps: ['Confirm that the expected advertiser account ID is being audited.']
        },
        verification: ['Confirm the advertiser account ID and intended campaign inventory.'],
        sourceDocs: []
      })
    )
  } else if (activeCampaigns.length === 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'medium',
        code: 'NO_ACTIVE_CAMPAIGNS',
        area: 'delivery',
        title: 'No campaigns are active',
        summary: `${campaignItems.length} campaigns exist, but none are active.`,
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: 'All discovered campaigns are non-active.'
        },
        evidence: [
          {
            source: 'audit.campaigns',
            key: 'campaignStatuses',
            value: campaignItems.map(campaign => ({
              id: campaign.id,
              name: campaign.name,
              status: campaign.status
            }))
          }
        ],
        remediation: {
          summary: 'Confirm whether delivery is intentionally paused or should be resumed.',
          backend: 'campaign-management',
          operation: 'updateCampaigns',
          steps: [
            'Identify campaigns that are expected to deliver.',
            'Check whether campaign status is the intended state.',
            'If delivery should resume, update the relevant campaign status and verify impressions.'
          ]
        },
        verification: ['Expected campaigns are active and begin reporting delivery.'],
        sourceDocs: [REPORTING_DOC]
      })
    )
  }

  if (
    activeCampaigns.length > 0 &&
    numberValue(reportTotals.impressions) === 0 &&
    report?.ok !== false
  ) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'high',
        code: 'ACTIVE_CAMPAIGNS_ZERO_IMPRESSIONS',
        area: 'delivery',
        title: 'Active campaigns are not generating impressions',
        summary:
          'At least one campaign is active, but the current campaign performance report contains zero impressions.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 0.95,
          rootCause: null,
          rationale:
            'Zero impressions confirms a delivery problem, but this signal alone does not identify whether the cause is targeting, editorial status, budget, bidding, product eligibility, or another delivery constraint.'
        },
        evidence: [
          {
            source: 'audit.campaigns',
            key: 'activeCampaigns',
            value: activeCampaigns.map(campaign => ({
              id: campaign.id,
              name: campaign.name,
              type: campaign.type
            }))
          },
          {
            source: 'audit.report.totals',
            key: 'impressions',
            value: reportTotals.impressions ?? 0
          }
        ],
        remediation: {
          summary: 'Diagnose the active campaigns for concrete delivery blockers before changing settings.',
          backend: 'campaign-management',
          operation: null,
          steps: [
            'Check campaign and ad group status, budgets, bids, targeting, editorial state, and eligible ads or products.',
            'Evaluate Microsoft Performance Insights and recommendations for delivery-specific root causes.',
            'Apply the identified remediation and verify impressions in Reporting.'
          ]
        },
        verification: [
          'Campaign Reporting returns impressions for the expected active campaigns.',
          'Any identified delivery blocker is no longer present.'
        ],
        sourceDocs: [REPORTING_DOC, PERFORMANCE_INSIGHTS_DOC]
      })
    )
  }

  for (const campaign of activeCampaigns) {
    const dailyBudget = numberOrNull(campaign?.dailyBudget)

    if (dailyBudget !== null && dailyBudget <= 0) {
      findings.push(
        createMicrosoftAdsHealthFinding({
          severity: 'critical',
          code: 'ACTIVE_CAMPAIGN_NON_POSITIVE_BUDGET',
          area: 'budget',
          title: 'Active campaign has no usable budget',
          summary: `Campaign '${campaign.name ?? campaign.id}' is active with a non-positive daily budget.`,
          entity: campaignEntity(campaign),
          diagnosis: {
            certainty: 'confirmed',
            confidence: 1,
            rootCause: `DailyBudget=${String(campaign.dailyBudget)}`
          },
          evidence: [
            {
              source: 'audit.campaigns',
              key: 'dailyBudget',
              value: campaign.dailyBudget
            }
          ],
          remediation: {
            summary: 'Set a valid campaign budget if the campaign is intended to deliver.',
            backend: 'campaign-management',
            operation: 'updateCampaigns',
            parameters: { campaignId: campaign.id },
            steps: [
              'Confirm the intended daily budget.',
              'Update the campaign budget.',
              'Verify campaign status and subsequent delivery.'
            ]
          },
          verification: [
            'Campaign budget is positive.',
            'Reporting shows delivery after the change.'
          ],
          sourceDocs: [REPORTING_DOC]
        })
      )
    }

    const adGroups = campaign?.adGroups
    const adGroupItems = Array.isArray(adGroups?.items) ? adGroups.items : []

    if (
      CAMPAIGN_TYPES_EXPECTING_AD_GROUPS.has(campaign?.type) &&
      adGroups?.error == null &&
      adGroupItems.length === 0
    ) {
      findings.push(
        createMicrosoftAdsHealthFinding({
          severity: 'high',
          code: 'ACTIVE_CAMPAIGN_WITHOUT_AD_GROUPS',
          area: 'structure',
          title: 'Active campaign has no ad groups',
          summary: `Campaign '${campaign.name ?? campaign.id}' is active but contains no discovered ad groups.`,
          entity: campaignEntity(campaign),
          diagnosis: {
            certainty: 'confirmed',
            confidence: 0.95,
            rootCause: 'No ad groups were returned for the active campaign.'
          },
          evidence: [
            {
              source: 'audit.campaigns',
              key: 'adGroupCount',
              value: 0
            }
          ],
          remediation: {
            summary: 'Restore a valid serving structure for the campaign.',
            backend: 'campaign-management',
            operation: null,
            steps: [
              'Confirm that the campaign type is expected to contain ad groups.',
              'Create or restore the intended ad group structure.',
              'Verify ads or product ads and targeting beneath the ad group.'
            ]
          },
          verification: ['The campaign contains the expected serving entities and begins reporting delivery.'],
          sourceDocs: []
        })
      )
    }

    for (const adGroup of adGroupItems.filter(isActive)) {
      if (adGroup?.ads?.error) {
        findings.push(
          createMicrosoftAdsHealthFinding({
            severity: 'high',
            code: 'ACTIVE_AD_GROUP_AD_READ_FAILED',
            area: 'diagnostics',
            title: 'Ads could not be read for an active ad group',
            summary: `Ads for active ad group '${adGroup.name ?? adGroup.id}' could not be read.`,
            entity: adGroupEntity(campaign, adGroup),
            diagnosis: {
              certainty: 'confirmed',
              confidence: 1,
              rootCause: adGroup.ads.error
            },
            evidence: [
              {
                source: 'audit.campaigns.adGroups.ads',
                key: 'error',
                value: adGroup.ads.error
              }
            ],
            remediation: {
              summary: 'Resolve the ad read failure before evaluating serving eligibility.',
              backend: 'campaign-management',
              operation: 'getAdsByAdGroupId',
              steps: [
                'Inspect the Microsoft API error.',
                'Re-read ads for the ad group.',
                'Re-run account health.'
              ]
            },
            verification: ['Ads for the ad group are returned successfully.'],
            sourceDocs: []
          })
        )
      } else {
        const ads = Array.isArray(adGroup?.ads?.items) ? adGroup.ads.items : []
        const activeAds = ads.filter(isActive)

        if (ads.length === 0 || activeAds.length === 0) {
          findings.push(
            createMicrosoftAdsHealthFinding({
              severity: 'high',
              code: 'ACTIVE_AD_GROUP_WITHOUT_ACTIVE_ADS',
              area: 'delivery',
              title: 'Active ad group has no active ads',
              summary: `Ad group '${adGroup.name ?? adGroup.id}' is active but has no active ads.`,
              entity: adGroupEntity(campaign, adGroup),
              diagnosis: {
                certainty: 'confirmed',
                confidence: 0.95,
                rootCause: ads.length === 0 ? 'No ads were returned.' : 'All discovered ads are non-active.'
              },
              evidence: [
                {
                  source: 'audit.campaigns.adGroups.ads',
                  key: 'statuses',
                  value: ads.map(ad => ({
                    id: ad.id,
                    status: ad.status,
                    editorialStatus: ad.editorialStatus
                  }))
                }
              ],
              remediation: {
                summary: 'Restore at least one eligible active ad in the ad group.',
                backend: 'campaign-management',
                operation: null,
                steps: [
                  'Check whether ads are paused, deleted, or editorially ineligible.',
                  'Restore or create an eligible ad as appropriate.',
                  'Verify ad group delivery in Reporting.'
                ]
              },
              verification: ['At least one eligible ad is active and the ad group reports impressions.'],
              sourceDocs: [REPORTING_DOC]
            })
          )
        }

        const editoriallyInactive = ads.filter(ad =>
          ['inactive', 'disapproved'].includes(
            String(ad?.editorialStatus ?? '').toLowerCase()
          )
        )

        if (editoriallyInactive.length > 0) {
          findings.push(
            createMicrosoftAdsHealthFinding({
              severity: activeAds.length === 0 ? 'high' : 'medium',
              code: 'ADS_WITH_EDITORIAL_ISSUES',
              area: 'editorial',
              title: 'Ads have editorial issues',
              summary: `${editoriallyInactive.length} ads in '${adGroup.name ?? adGroup.id}' are editorially inactive or disapproved.`,
              entity: adGroupEntity(campaign, adGroup),
              diagnosis: {
                certainty: 'confirmed',
                confidence: 0.95,
                rootCause: 'Microsoft returned an editorial status indicating the ads are not fully eligible.'
              },
              evidence: [
                {
                  source: 'audit.campaigns.adGroups.ads',
                  key: 'editorialIssues',
                  value: editoriallyInactive.map(ad => ({
                    id: ad.id,
                    type: ad.type,
                    status: ad.status,
                    editorialStatus: ad.editorialStatus
                  }))
                }
              ],
              remediation: {
                summary: 'Retrieve the exact editorial reason and correct the affected ad assets or policy issue.',
                backend: 'campaign-management',
                operation: null,
                steps: [
                  'Read the editorial reasons for the affected entities.',
                  'Determine whether the issue is copy, landing page, asset, trademark, or another policy constraint.',
                  'Correct the cause and verify editorial approval.'
                ]
              },
              verification: ['Affected ads return an eligible editorial status and can serve.'],
              sourceDocs: []
            })
          )
        }
      }

      const inactiveEditorialKeywords = numberValue(
        adGroup?.keywords?.inactiveEditorialCount
      )

      if (inactiveEditorialKeywords > 0) {
        findings.push(
          createMicrosoftAdsHealthFinding({
            severity: 'medium',
            code: 'KEYWORDS_WITH_EDITORIAL_ISSUES',
            area: 'editorial',
            title: 'Keywords have editorial issues',
            summary: `${inactiveEditorialKeywords} keywords in '${adGroup.name ?? adGroup.id}' are editorially inactive.`,
            entity: adGroupEntity(campaign, adGroup),
            diagnosis: {
              certainty: 'confirmed',
              confidence: 0.95,
              rootCause: 'Microsoft returned inactive editorial status for one or more keywords.'
            },
            evidence: [
              {
                source: 'audit.campaigns.adGroups.keywords',
                key: 'inactiveEditorialCount',
                value: inactiveEditorialKeywords
              }
            ],
            remediation: {
              summary: 'Inspect the exact editorial reason for the affected keywords and correct or remove the cause.',
              backend: 'campaign-management',
              operation: null,
              steps: [
                'Identify the affected keyword IDs.',
                'Retrieve or inspect their editorial reasons.',
                'Correct the issue and verify eligibility.'
              ]
            },
            verification: ['Affected keywords are eligible or intentionally removed.'],
            sourceDocs: []
          })
        )
      }
    }
  }

  addPerformanceInsightFindings(findings, adInsight?.performanceInsights)
  addRecommendationFinding(findings, adInsight?.recommendations)

  const coverageChecks = [
    coverageCheck('campaigns', campaigns?.ok !== false && !campaigns?.error, campaigns?.error),
    coverageCheck('reporting', report?.ok !== false && !report?.error, report?.error),
    coverageCheck(
      'performanceInsights',
      adInsight?.performanceInsights?.ok !== false,
      adInsight?.performanceInsights?.error
    )
  ]

  return createMicrosoftAdsHealthResult({
    scope: 'account',
    findings,
    coverage: {
      complete: coverageChecks.every(check => check.ok),
      checks: coverageChecks
    },
    metrics: {
      campaignCount: campaignItems.length,
      activeCampaignCount: activeCampaigns.length,
      impressions: numberValue(reportTotals.impressions),
      clicks: numberValue(reportTotals.clicks),
      spend: numberValue(reportTotals.spend),
      recommendations: numberValue(adInsight?.recommendations?.count),
      performanceInsights: numberValue(adInsight?.performanceInsights?.count)
    }
  })
}

function addPerformanceInsightFindings(findings, performanceInsights) {
  if (!performanceInsights?.ok) {
    return
  }

  for (const insight of (performanceInsights.items ?? []).slice(0, 25)) {
    const rootCauses = (insight.RootCauses ?? [])
      .map(summarizeInsightMessage)
      .filter(Boolean)
    const actions = (insight.Actions ?? [])
      .map(summarizeInsightMessage)
      .filter(Boolean)
    const description = summarizeInsightMessage(insight.Description)

    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: rootCauses.length > 0 ? 'medium' : 'info',
        code: 'MICROSOFT_PERFORMANCE_INSIGHT',
        area: 'optimization',
        title: `Microsoft Performance Insight${insight.KPIType ? `: ${insight.KPIType}` : ''}`,
        summary:
          description ||
          `Microsoft returned a performance insight for ${insight.EntityType ?? 'an account entity'}.`,
        entity: {
          type: String(insight.EntityType ?? 'account').toLowerCase(),
          id: insight.EntityId ?? null,
          name: null
        },
        diagnosis: {
          certainty: rootCauses.length > 0 ? 'probable' : 'unknown',
          confidence: rootCauses.length > 0 ? 0.8 : 0.5,
          rootCause: rootCauses.length > 0 ? rootCauses.join(' | ') : null,
          rationale:
            'This diagnosis is surfaced by Microsoft Performance Insights and should be validated against current account data before mutation.'
        },
        evidence: [
          {
            source: 'audit.adInsight.performanceInsights',
            key: 'insight',
            value: insight
          }
        ],
        remediation: {
          summary:
            actions.length > 0
              ? actions.join(' | ')
              : 'Evaluate the insight against current campaign settings and performance before changing the account.',
          backend: 'ad-insight',
          operation: 'getPerformanceInsightsDetailDataByAccountId',
          steps:
            actions.length > 0
              ? actions
              : [
                  'Validate the insight against current Reporting and Campaign Management data.',
                  'Apply only the remediation supported by the current evidence.',
                  'Re-run performance reporting after the change.'
                ]
        },
        verification: [
          'The underlying KPI or delivery condition improves in a subsequent comparable reporting window.'
        ],
        sourceDocs: [PERFORMANCE_INSIGHTS_DOC]
      })
    )
  }
}

function addRecommendationFinding(findings, recommendations) {
  if (!recommendations?.ok || numberValue(recommendations?.count) === 0) {
    return
  }

  findings.push(
    createMicrosoftAdsHealthFinding({
      severity: 'info',
      code: 'MICROSOFT_RECOMMENDATIONS_AVAILABLE',
      area: 'optimization',
      title: 'Microsoft recommendations are available',
      summary: `${recommendations.count} Microsoft Advertising recommendations are available for evaluation.`,
      diagnosis: {
        certainty: 'confirmed',
        confidence: 1,
        rootCause: null,
        rationale:
          'Recommendations are opportunity signals, not proof that applying them will improve the account.'
      },
      evidence: [
        {
          source: 'audit.adInsight.recommendations',
          key: 'byType',
          value: recommendations.byType ?? {}
        }
      ],
      remediation: {
        summary: 'Evaluate recommendations against actual Utekos performance and business constraints before applying them.',
        backend: 'ad-insight',
        operation: 'retrieveRecommendations',
        steps: [
          'Prioritize recommendations by estimated impact and affected entity.',
          'Cross-check each recommendation against current Reporting data and campaign intent.',
          'Apply only recommendations supported by the evidence, then verify performance.'
        ]
      },
      verification: ['Any applied recommendation is followed by a comparable before/after performance check.'],
      sourceDocs: [RECOMMENDATIONS_DOC]
    })
  )
}

function summarizeInsightMessage(message) {
  if (!message || typeof message !== 'object') {
    return ''
  }

  const texts = []

  for (const parameter of message.Parameters ?? []) {
    if (parameter?.SuggestedText) {
      texts.push(String(parameter.SuggestedText))
    }

    for (const entity of parameter?.EntityDetails ?? []) {
      if (entity?.EntityName) {
        texts.push(String(entity.EntityName))
      }
    }
  }

  return texts.length > 0
    ? texts.join(' — ')
    : message.TemplateId
      ? `Microsoft insight template ${message.TemplateId}`
      : ''
}

function coverageCheck(name, ok, reason) {
  return {
    name,
    ok: Boolean(ok),
    reason: ok ? null : reason ?? 'Read unavailable.'
  }
}

function isActive(entity) {
  return String(entity?.status ?? '').toLowerCase() === 'active'
}

function numberValue(value) {
  return Number(String(value ?? '').replaceAll(',', '')) || 0
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function sanitizeCode(value) {
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function campaignEntity(campaign) {
  return {
    type: 'campaign',
    id: campaign?.id ?? null,
    name: campaign?.name ?? null
  }
}

function adGroupEntity(campaign, adGroup) {
  return {
    type: 'ad_group',
    id: adGroup?.id ?? null,
    name: adGroup?.name ?? campaign?.name ?? null
  }
}
