export function buildTechDownExperimentSpec() {
  return {
    schemaVersion: 'utekos-audience-experiment/v1',
    graphApiVersion: 'v26.0',
    name: 'UTEKOS | TechDown | New customers | Value Rules 4C v1',
    status: 'PAUSED',
    providerCreated: false,
    accountId: '772268237116474',
    catalogId: '690208780604782',
    landingPage: 'https://utekos.no/skreddersy-varmen',
    productScope:
      'Approved in-stock TechDown only; no Stapper, Comfyrobe, Microfiber or Dun',
    variable: 'Value Rule package versus no Value Rules',
    durationDays: 14,
    plannedAverageDailyNok: 3000,
    totalMaximumNok: 42000,
    startTime: null,
    endTime: null,
    autoExtend: false,
    confidenceLevel: 0.95,
    randomization: {
      method: 'META_SPLIT_TEST',
      type: 'SPLIT_TEST',
      providerVerified: false,
      mutuallyExclusiveCellsRequired: true,
      businessId: null,
      studyId: null
    },
    cells: [
      {
        key: 'A',
        allocationPercent: 50,
        plannedAverageDailyNok: 1500,
        lifetimeBudgetNok: 21000,
        status: 'PAUSED',
        valueRulesApplied: false,
        adsetId: null
      },
      {
        key: 'B',
        allocationPercent: 50,
        plannedAverageDailyNok: 1500,
        lifetimeBudgetNok: 21000,
        status: 'PAUSED',
        valueRulesApplied: true,
        adsetId: null
      }
    ],
    commonSettings: {
      audience:
        'Broad Advantage+; identical audited suggestions',
      creativeIds: [],
      productSetId: null,
      buyerExclusionIds: [],
      removeWebsiteVisitorExclusionId: '120233876074710788',
      placements: 'Identical approved placements in both cells',
      attribution: 'Identical readback required before creation',
      allowBudgetReallocationBetweenCells: false
    },
    costs: null,
    economicStopLossNok: null,
    primaryOutcomes: [
      'verified_new_customers',
      'new_customer_cac',
      'contribution_after_ads'
    ],
    separateMetrics: [
      'meta_attributed_purchases',
      'shopify_paid_purchases',
      'unattributed_purchases',
      'unknown_customer_status'
    ],
    stopConditions: [
      'wrong_landing_page',
      'advertised_out_of_stock_variant',
      'incorrect_buyer_exclusion',
      'critical_tracking_failure',
      'locked_economic_stop_loss',
      'test_end'
    ],
    inference:
      'Relative effect of rule package only; not absolute advertising lift, nor separate causal effect of each criterion',
    decisionWhenUnderpowered: 'inconclusive',
    activationGates: [
      'label_scope_verified',
      'four_criteria_api_readback',
      'buyer_sources_and_exclusions_verified',
      'approved_creative_and_catalog_readback',
      'pixel_capi_deduplication_verified',
      'costs_and_stop_loss_locked',
      'randomized_study_readback',
      'start_and_end_locked',
      'operator_review_approved'
    ]
  } as const
}
