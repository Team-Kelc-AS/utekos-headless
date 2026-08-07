import {
  createMicrosoftAdsHealthFinding,
  createMicrosoftAdsHealthResult
} from './finding-schema.mjs'

const PRODUCTS_DOC =
  'https://learn.microsoft.com/advertising/shopping-content/products-resource'
const CATALOGS_DOC =
  'https://learn.microsoft.com/advertising/shopping-content/catalogs-resource'
const PRODUCT_STATUSES_DOC =
  'https://learn.microsoft.com/advertising/shopping-content/product-offer-statuses'

export function analyzeMicrosoftAdsMerchantHealth(
  audit,
  { outOfStockRatioThreshold = 0.75 } = {}
) {
  const findings = []
  const shoppingContent = audit?.shoppingContent
  const merchantStoreId =
    audit?.account?.merchantStoreId ?? audit?.config?.merchantStoreId ?? null
  const campaignItems = Array.isArray(audit?.campaigns?.campaigns)
    ? audit.campaigns.campaigns
    : []
  const activeShoppingCampaigns = campaignItems.filter(
    campaign =>
      String(campaign?.status).toLowerCase() === 'active' &&
      ['Shopping', 'PerformanceMax'].includes(campaign?.type)
  )
  const merchantRequired = activeShoppingCampaigns.length > 0

  if (!merchantStoreId) {
    if (merchantRequired) {
      findings.push(
        createMicrosoftAdsHealthFinding({
          severity: 'high',
          code: 'ACTIVE_SHOPPING_WITHOUT_MERCHANT_STORE_ID',
          area: 'merchant_center',
          title: 'Merchant Center store is not configured for diagnostics',
          summary:
            'Shopping or Performance Max campaigns are active, but the Merchant Center store ID is not available to the operator.',
          diagnosis: {
            certainty: 'confirmed',
            confidence: 1,
            rootCause: 'MICROSOFT_MERCHANT_CENTER_STORE_ID is unavailable to the health scan.'
          },
          evidence: [
            {
              source: 'audit.campaigns',
              key: 'activeShoppingCampaigns',
              value: activeShoppingCampaigns.map(campaign => ({
                id: campaign.id,
                name: campaign.name,
                type: campaign.type
              }))
            }
          ],
          remediation: {
            summary: 'Configure the correct Merchant Center store ID for the advertiser account.',
            backend: 'account-settings',
            operation: null,
            steps: [
              'Confirm the Merchant Center store used by the active campaigns.',
              'Set MICROSOFT_MERCHANT_CENTER_STORE_ID to that store ID in the relevant environment.',
              'Re-run Merchant health and verify catalogs/products.'
            ]
          },
          verification: ['Merchant health successfully reads the expected store, catalogs, and products.'],
          sourceDocs: [CATALOGS_DOC, PRODUCTS_DOC]
        })
      )
    }

    return createMicrosoftAdsHealthResult({
      scope: 'merchant',
      findings,
      coverage: {
        complete: !merchantRequired,
        checks: [
          {
            name: 'merchantStoreId',
            ok: !merchantRequired,
            reason: merchantRequired ? 'Merchant store ID is missing.' : null
          }
        ]
      },
      metrics: {
        activeShoppingCampaignCount: activeShoppingCampaigns.length,
        merchantStoreIdPresent: false
      }
    })
  }

  if (shoppingContent?.skipped) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: merchantRequired ? 'high' : 'medium',
        code: 'MERCHANT_CONTENT_READ_SKIPPED',
        area: 'merchant_center',
        title: 'Merchant Center health read was skipped',
        summary: shoppingContent.reason ?? 'The Shopping Content read was skipped.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: shoppingContent.reason ?? null
        },
        evidence: [
          {
            source: 'audit.shoppingContent',
            key: 'reason',
            value: shoppingContent.reason ?? null
          }
        ],
        remediation: {
          summary: 'Restore a supported Merchant Center read path.',
          backend: 'shopping-content',
          operation: null,
          steps: [
            'Verify production credentials and the configured store ID.',
            'Re-run Shopping Content catalog and product reads.',
            'Re-run Merchant health.'
          ]
        },
        verification: ['Catalog and product reads succeed for the configured store.'],
        sourceDocs: [PRODUCTS_DOC]
      })
    )
  } else if (shoppingContent?.ok === false) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: merchantRequired ? 'high' : 'medium',
        code: 'MERCHANT_CONTENT_READ_FAILED',
        area: 'merchant_center',
        title: 'Merchant Center could not be fully read',
        summary: shoppingContent.error ?? 'The Merchant Center read did not complete successfully.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: shoppingContent.error ?? null
        },
        evidence: [
          {
            source: 'audit.shoppingContent',
            key: 'error',
            value: shoppingContent.error ?? null
          }
        ],
        remediation: {
          summary: 'Resolve the failed Shopping Content read before treating product health as known.',
          backend: 'shopping-content',
          operation: null,
          steps: [
            'Inspect the Shopping Content API error and request activity ID if available.',
            'Verify OAuth, developer token, customer/account context, and store ID.',
            'Re-read catalogs and products.'
          ]
        },
        verification: ['Shopping Content catalog and product reads succeed.'],
        sourceDocs: [PRODUCTS_DOC, CATALOGS_DOC]
      })
    )
  }

  const catalogs = shoppingContent?.catalogs ?? {}
  const catalogItems = Array.isArray(catalogs?.items) ? catalogs.items : []

  if (catalogs?.error) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: merchantRequired ? 'high' : 'medium',
        code: 'MERCHANT_CATALOG_READ_FAILED',
        area: 'merchant_center',
        title: 'Merchant catalogs could not be read',
        summary: 'The operator could not retrieve Merchant Center catalogs.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: catalogs.error
        },
        evidence: [
          {
            source: 'audit.shoppingContent.catalogs',
            key: 'error',
            value: catalogs.error
          }
        ],
        remediation: {
          summary: 'Resolve Catalogs API access before diagnosing feed configuration.',
          backend: 'shopping-content',
          operation: 'listCatalogs',
          steps: [
            'Resolve the catalog read failure.',
            'Re-read the store catalogs.',
            'Re-run Merchant health.'
          ]
        },
        verification: ['Catalogs are returned successfully.'],
        sourceDocs: [CATALOGS_DOC]
      })
    )
  } else if (catalogItems.length === 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: merchantRequired ? 'high' : 'medium',
        code: 'MERCHANT_NO_CATALOGS',
        area: 'merchant_center',
        title: 'Merchant Center has no visible catalogs',
        summary: 'The configured store returned no catalogs.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: 'Catalog list is empty.'
        },
        evidence: [
          {
            source: 'audit.shoppingContent.catalogs',
            key: 'count',
            value: 0
          }
        ],
        remediation: {
          summary: 'Create or restore the catalog that should supply products to Microsoft Advertising.',
          backend: 'shopping-content',
          operation: null,
          steps: [
            'Confirm the expected store is correct.',
            'Restore or create the intended catalog and feed configuration.',
            'Verify product ingestion.'
          ]
        },
        verification: ['At least one expected catalog is returned and contains products.'],
        sourceDocs: [CATALOGS_DOC]
      })
    )
  } else {
    const publishingCatalogs = catalogItems.filter(
      catalog => catalog?.isPublishingEnabled !== false
    )

    if (publishingCatalogs.length === 0) {
      findings.push(
        createMicrosoftAdsHealthFinding({
          severity: merchantRequired ? 'high' : 'medium',
          code: 'MERCHANT_ALL_CATALOGS_PUBLISHING_DISABLED',
          area: 'merchant_center',
          title: 'All Merchant catalogs have publishing disabled',
          summary: 'No discovered Merchant Center catalog is publishing-enabled.',
          diagnosis: {
            certainty: 'confirmed',
            confidence: 1,
            rootCause: 'isPublishingEnabled is false for every discovered catalog.'
          },
          evidence: [
            {
              source: 'audit.shoppingContent.catalogs',
              key: 'catalogs',
              value: catalogItems.map(catalog => ({
                id: catalog.id,
                name: catalog.name,
                isDefault: catalog.isDefault,
                isPublishingEnabled: catalog.isPublishingEnabled
              }))
            }
          ],
          remediation: {
            summary: 'Enable publishing on the catalog that should serve ads, unless disabled intentionally for testing.',
            backend: 'shopping-content',
            operation: null,
            steps: [
              'Identify the catalog that should be live.',
              'Confirm publishing was not intentionally disabled.',
              'Enable publishing for the intended catalog and verify product eligibility.'
            ]
          },
          verification: ['The intended catalog is publishing-enabled and products become eligible to serve.'],
          sourceDocs: [CATALOGS_DOC]
        })
      )
    }
  }

  const products = shoppingContent?.products ?? {}
  const productCount = numberValue(products?.count)
  const inStockCount = numberValue(products?.inStockCount)
  const outOfStockCount = numberValue(products?.outOfStockCount)

  if (products?.error) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: merchantRequired ? 'high' : 'medium',
        code: 'MERCHANT_PRODUCT_READ_FAILED',
        area: 'merchant_center',
        title: 'Merchant products could not be read',
        summary: 'The operator could not retrieve the store product inventory.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: products.error
        },
        evidence: [
          {
            source: 'audit.shoppingContent.products',
            key: 'error',
            value: products.error
          }
        ],
        remediation: {
          summary: 'Resolve Products API access before diagnosing Shopping delivery.',
          backend: 'shopping-content',
          operation: 'listAllProducts',
          steps: [
            'Resolve the product read failure.',
            'Re-read the store product inventory.',
            'Re-run Merchant health.'
          ]
        },
        verification: ['Product inventory is returned successfully.'],
        sourceDocs: [PRODUCTS_DOC]
      })
    )
  } else if (productCount === 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: merchantRequired ? 'high' : 'medium',
        code: 'MERCHANT_ZERO_PRODUCTS',
        area: 'merchant_center',
        title: 'Merchant Center contains no visible products',
        summary: 'The configured Merchant Center store returned zero products.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: 'Product inventory is empty.'
        },
        evidence: [
          {
            source: 'audit.shoppingContent.products',
            key: 'count',
            value: 0
          }
        ],
        remediation: {
          summary: 'Restore product ingestion into the catalog used by Microsoft Advertising.',
          backend: 'shopping-content',
          operation: null,
          steps: [
            'Verify the upstream feed or API source is running.',
            'Confirm products are being written to the intended store/catalog.',
            'Verify product visibility through the Content API.'
          ]
        },
        verification: ['Products are visible in the Content API and eligible products are available to campaigns.'],
        sourceDocs: [PRODUCTS_DOC]
      })
    )
  } else {
    if (inStockCount === 0) {
      findings.push(
        createMicrosoftAdsHealthFinding({
          severity: merchantRequired ? 'high' : 'medium',
          code: 'MERCHANT_ZERO_IN_STOCK_PRODUCTS',
          area: 'merchant_center',
          title: 'No Merchant products are in stock',
          summary: `${productCount} products are visible, but none are reported as in stock.`,
          diagnosis: {
            certainty: 'confirmed',
            confidence: 1,
            rootCause: 'Every visible product is non-in-stock or has an unrecognized availability value.'
          },
          evidence: [
            {
              source: 'audit.shoppingContent.products',
              key: 'availability',
              value: {
                count: productCount,
                inStockCount,
                outOfStockCount,
                byAvailability: products.byAvailability ?? null
              }
            }
          ],
          remediation: {
            summary: 'Correct inventory availability at the source of truth if products should be purchasable.',
            backend: 'shopping-content',
            operation: null,
            steps: [
              'Determine whether the store inventory is genuinely out of stock.',
              'If not, correct the upstream availability source rather than patching Microsoft-only state that will be overwritten.',
              'Re-sync and verify availability in Merchant Center.'
            ]
          },
          verification: ['Expected purchasable products are reported as in stock.'],
          sourceDocs: [PRODUCTS_DOC]
        })
      )
    } else {
      const ratio = outOfStockCount / productCount

      if (ratio >= normalizeRatio(outOfStockRatioThreshold)) {
        findings.push(
          createMicrosoftAdsHealthFinding({
            severity: 'medium',
            code: 'MERCHANT_HIGH_OUT_OF_STOCK_RATIO',
            area: 'merchant_center',
            title: 'Most Merchant products are out of stock',
            summary: `${outOfStockCount} of ${productCount} visible products are out of stock.`,
            diagnosis: {
              certainty: 'confirmed',
              confidence: 1,
              rootCause: null,
              rationale:
                'A high out-of-stock ratio reduces the product pool available to Shopping and Performance Max, but can be legitimate if inventory is intentionally limited.'
            },
            evidence: [
              {
                source: 'audit.shoppingContent.products',
                key: 'outOfStockRatio',
                value: ratio
              }
            ],
            remediation: {
              summary: 'Confirm whether the inventory state is expected and correct stale availability if necessary.',
              backend: 'shopping-content',
              operation: null,
              steps: [
                'Compare Microsoft availability with the upstream commerce inventory.',
                'Correct stale or incorrect availability at the source of truth.',
                'Re-sync and verify the eligible product pool.'
              ]
            },
            verification: ['Microsoft product availability matches the commerce source of truth.'],
            sourceDocs: [PRODUCTS_DOC]
          })
        )
      }
    }

    if (numberValue(products?.warningCount) > 0) {
      findings.push(
        createMicrosoftAdsHealthFinding({
          severity: 'low',
          code: 'MERCHANT_PRODUCT_WARNINGS_PRESENT',
          area: 'merchant_center',
          title: 'Product feed warnings are present',
          summary: `${products.warningCount} product warnings were returned by the Content API data available to the audit.`,
          diagnosis: {
            certainty: 'confirmed',
            confidence: 0.9,
            rootCause: null
          },
          evidence: [
            {
              source: 'audit.shoppingContent.products',
              key: 'warningCount',
              value: products.warningCount
            }
          ],
          remediation: {
            summary: 'Inspect and correct the individual product warnings where they affect data quality or eligibility.',
            backend: 'shopping-content',
            operation: null,
            steps: [
              'Retrieve the affected offers and warning details.',
              'Identify the upstream product attribute responsible.',
              'Correct the source data and re-sync.'
            ]
          },
          verification: ['The affected offers no longer return the warning after reprocessing.'],
          sourceDocs: [PRODUCTS_DOC]
        })
      )
    }

    addCatalogProductConsistencyFindings(findings, catalogItems, products.sample ?? [])
  }

  addProductStatusFindings(findings, shoppingContent?.productStatuses)

  const coverageChecks = [
    {
      name: 'catalogs',
      ok: !catalogs?.error && !shoppingContent?.skipped,
      reason: catalogs?.error ?? (shoppingContent?.skipped ? shoppingContent.reason : null)
    },
    {
      name: 'products',
      ok: !products?.error && !shoppingContent?.skipped,
      reason: products?.error ?? (shoppingContent?.skipped ? shoppingContent.reason : null)
    },
    {
      name: 'productStatuses',
      ok:
        shoppingContent?.productStatuses?.summary != null ||
        shoppingContent?.productStatuses?.count > 0,
      reason:
        shoppingContent?.productStatuses?.summaryError ??
        shoppingContent?.productStatuses?.error ??
        'ProductStatuses is a closed-beta API and may not be available to this account.'
    }
  ]

  return createMicrosoftAdsHealthResult({
    scope: 'merchant',
    findings,
    coverage: {
      complete: coverageChecks[0].ok && coverageChecks[1].ok,
      checks: coverageChecks
    },
    metrics: {
      activeShoppingCampaignCount: activeShoppingCampaigns.length,
      merchantStoreIdPresent: true,
      catalogCount: catalogItems.length,
      productCount,
      inStockCount,
      outOfStockCount,
      disapprovedCount: numberValue(shoppingContent?.productStatuses?.disapprovedCount),
      warningStatusCount: numberValue(shoppingContent?.productStatuses?.warningCount)
    }
  })
}

function addProductStatusFindings(findings, productStatuses) {
  if (!productStatuses) {
    return
  }

  const summary = productStatuses.summary
  const disapproved = Math.max(
    numberValue(productStatuses.disapprovedCount),
    numberValue(summary?.disapproved)
  )
  const warningCount = numberValue(productStatuses.warningCount)
  const pending = numberValue(summary?.pending)
  const expiring = numberValue(summary?.expiring)

  if (disapproved > 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'high',
        code: 'MERCHANT_PRODUCTS_DISAPPROVED',
        area: 'merchant_center',
        title: 'Merchant products are disapproved',
        summary: `${disapproved} product offers are reported as disapproved.`,
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: 'Microsoft Merchant Center product status reports one or more disapproved offers.'
        },
        evidence: [
          {
            source: 'audit.shoppingContent.productStatuses',
            key: 'disapprovedCount',
            value: disapproved
          }
        ],
        remediation: {
          summary: 'Resolve the item-level Merchant issues at their actual source of truth.',
          backend: 'shopping-content',
          operation: null,
          steps: [
            'Group disapproved products by issue code.',
            'For each issue, identify whether the source is Shopify/product data, feed generation, Microsoft-only configuration, or policy/editorial review.',
            'Correct the upstream source where applicable, re-sync, and wait for reprocessing.'
          ]
        },
        verification: ['Previously disapproved offers return an approved or otherwise expected eligible status.'],
        sourceDocs: [PRODUCT_STATUSES_DOC]
      })
    )
  }

  if (warningCount > 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'medium',
        code: 'MERCHANT_STATUS_WARNINGS_PRESENT',
        area: 'merchant_center',
        title: 'Merchant product-status warnings are present',
        summary: `${warningCount} offers are reported with Warning status.`,
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: null
        },
        evidence: [
          {
            source: 'audit.shoppingContent.productStatuses',
            key: 'warningCount',
            value: warningCount
          }
        ],
        remediation: {
          summary: 'Review warning-level issues before they become eligibility or quality problems.',
          backend: 'shopping-content',
          operation: null,
          steps: [
            'Group warnings by issue code.',
            'Correct product/feed attributes at the upstream source.',
            'Verify the warning disappears after reprocessing.'
          ]
        },
        verification: ['Affected product warnings are resolved or documented as intentional.'],
        sourceDocs: [PRODUCT_STATUSES_DOC]
      })
    )
  }

  if (expiring > 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'medium',
        code: 'MERCHANT_PRODUCTS_EXPIRING',
        area: 'merchant_center',
        title: 'Merchant products are approaching expiration',
        summary: `${expiring} product offers are reported as expiring.`,
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: 'Microsoft ProductStatuses summary reports expiring offers.'
        },
        evidence: [
          {
            source: 'audit.shoppingContent.productStatuses.summary',
            key: 'expiring',
            value: expiring
          }
        ],
        remediation: {
          summary: 'Refresh or re-submit products before they expire if they should remain advertised.',
          backend: 'shopping-content',
          operation: null,
          steps: [
            'Identify the expiring offers.',
            'Confirm the scheduled feed/API refresh is still running.',
            'Refresh product data and verify new expiration dates.'
          ]
        },
        verification: ['Expected products no longer appear in the expiring count after refresh.'],
        sourceDocs: [PRODUCTS_DOC, PRODUCT_STATUSES_DOC]
      })
    )
  }

  if (pending > 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'info',
        code: 'MERCHANT_PRODUCTS_PENDING_REVIEW',
        area: 'merchant_center',
        title: 'Merchant products are pending review',
        summary: `${pending} product offers are pending Microsoft review.`,
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: null
        },
        evidence: [
          {
            source: 'audit.shoppingContent.productStatuses.summary',
            key: 'pending',
            value: pending
          }
        ],
        remediation: {
          summary: 'No mutation is indicated solely by pending-review status; continue monitoring unless the state persists abnormally.',
          backend: 'shopping-content',
          operation: null,
          steps: ['Monitor the pending offers and inspect detailed issues if they transition to Warning or Disapproved.']
        },
        verification: ['Pending offers transition to an expected reviewed state.'],
        sourceDocs: [PRODUCT_STATUSES_DOC]
      })
    )
  }

  const groupedIssues = new Map()

  for (const item of productStatuses.items ?? []) {
    for (const issue of item?.itemLevelIssues ?? []) {
      const code = sanitizeCode(issue?.code ?? 'UNKNOWN')
      const current = groupedIssues.get(code) ?? {
        code,
        originalCode: issue?.code ?? 'Unknown',
        descriptions: new Set(),
        products: [],
        disapproved: false
      }

      if (issue?.description) {
        current.descriptions.add(String(issue.description))
      }

      if (current.products.length < 20) {
        current.products.push({
          productId: item?.productId ?? null,
          title: item?.title ?? null,
          status: item?.status ?? null,
          servability: issue?.servability ?? null
        })
      }

      current.disapproved ||=
        String(item?.status).toLowerCase() === 'disapproved' ||
        String(issue?.servability).toLowerCase() === 'disapproved'

      groupedIssues.set(code, current)
    }
  }

  for (const issueGroup of groupedIssues.values()) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: issueGroup.disapproved ? 'high' : 'medium',
        code: `MERCHANT_ISSUE_${issueGroup.code}`,
        area: 'merchant_center',
        title: `Merchant issue: ${issueGroup.originalCode}`,
        summary:
          [...issueGroup.descriptions].join(' | ') ||
          `Microsoft reports Merchant issue ${issueGroup.originalCode}.`,
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: [...issueGroup.descriptions].join(' | ') || null
        },
        evidence: [
          {
            source: 'audit.shoppingContent.productStatuses.items',
            key: 'affectedProducts',
            value: issueGroup.products
          }
        ],
        remediation: {
          summary: 'Trace this Microsoft issue code to the responsible product/feed/configuration source and correct it there.',
          backend: 'shopping-content',
          operation: null,
          parameters: { issueCode: issueGroup.originalCode },
          steps: [
            'Inspect all affected products and the exact issue description.',
            'Determine the authoritative source of the invalid value or policy problem.',
            'Correct the source and re-submit or wait for the next feed sync.',
            'Verify the issue code disappears after Microsoft reprocesses the offer.'
          ]
        },
        verification: [`No affected product remains in issue group ${issueGroup.originalCode}.`],
        sourceDocs: [PRODUCT_STATUSES_DOC]
      })
    )
  }
}

function addCatalogProductConsistencyFindings(findings, catalogs, products) {
  if (catalogs.length === 0 || products.length === 0) {
    return
  }

  const allowedCountries = new Set()
  const allowedFeedLabels = new Set()

  for (const catalog of catalogs) {
    for (const country of catalog?.targetCountries ?? []) {
      allowedCountries.add(String(country).toUpperCase())
    }

    if (catalog?.market && String(catalog.market).includes('-')) {
      const country = String(catalog.market).split('-').at(-1)
      if (country) {
        allowedCountries.add(country.toUpperCase())
      }
    }

    if (catalog?.feedLabel) {
      allowedFeedLabels.add(String(catalog.feedLabel).toUpperCase())
    }
  }

  if (allowedCountries.size > 0) {
    const mismatches = products.filter(product => {
      if (!product?.targetCountry) {
        return false
      }

      return !allowedCountries.has(String(product.targetCountry).toUpperCase())
    })

    if (mismatches.length > 0) {
      findings.push(
        createMicrosoftAdsHealthFinding({
          severity: 'high',
          code: 'MERCHANT_PRODUCT_TARGET_COUNTRY_MISMATCH',
          area: 'merchant_center',
          title: 'Product target country does not match visible catalog markets',
          summary: `${mismatches.length} sampled products target a country not represented by the visible catalog configuration.`,
          diagnosis: {
            certainty: 'probable',
            confidence: 0.85,
            rootCause: 'Product targetCountry and visible catalog targetCountries/market are inconsistent.'
          },
          evidence: [
            {
              source: 'audit.shoppingContent',
              key: 'targetCountryMismatch',
              value: {
                allowedCountries: [...allowedCountries],
                products: mismatches.slice(0, 20)
              }
            }
          ],
          remediation: {
            summary: 'Align product market data with the catalog that should publish those offers.',
            backend: 'shopping-content',
            operation: null,
            steps: [
              'Confirm the intended market for each affected product.',
              'Correct either the product target country/feed generation or the catalog market configuration at its source of truth.',
              'Re-sync and verify product eligibility.'
            ]
          },
          verification: ['Sampled product target countries align with an intended catalog market.'],
          sourceDocs: [CATALOGS_DOC, PRODUCTS_DOC]
        })
      )
    }
  }

  if (allowedFeedLabels.size > 0) {
    const mismatches = products.filter(product => {
      if (!product?.feedLabel) {
        return false
      }

      return !allowedFeedLabels.has(String(product.feedLabel).toUpperCase())
    })

    if (mismatches.length > 0) {
      findings.push(
        createMicrosoftAdsHealthFinding({
          severity: 'high',
          code: 'MERCHANT_PRODUCT_FEED_LABEL_MISMATCH',
          area: 'merchant_center',
          title: 'Product feed label does not match visible catalogs',
          summary: `${mismatches.length} sampled products contain a feed label that does not match a visible catalog feed label.`,
          diagnosis: {
            certainty: 'probable',
            confidence: 0.85,
            rootCause: 'Product feedLabel and visible catalog feedLabel values are inconsistent.'
          },
          evidence: [
            {
              source: 'audit.shoppingContent',
              key: 'feedLabelMismatch',
              value: {
                allowedFeedLabels: [...allowedFeedLabels],
                products: mismatches.slice(0, 20)
              }
            }
          ],
          remediation: {
            summary: 'Align feed labels across catalog configuration, feed generation, and campaign product filters.',
            backend: 'shopping-content',
            operation: null,
            steps: [
              'Confirm the intended catalog/feed label.',
              'Correct the upstream feed label or catalog configuration.',
              'Verify campaign product filters use the same label.'
            ]
          },
          verification: ['Product feed labels, catalog feed labels, and campaign filters use the intended matching value.'],
          sourceDocs: [CATALOGS_DOC, PRODUCTS_DOC]
        })
      )
    }
  }
}

function numberValue(value) {
  return Number(String(value ?? '').replaceAll(',', '')) || 0
}

function normalizeRatio(value) {
  const ratio = Number(value)

  if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
    throw new TypeError('outOfStockRatioThreshold must be between 0 and 1.')
  }

  return ratio
}

function sanitizeCode(value) {
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'UNKNOWN'
}
