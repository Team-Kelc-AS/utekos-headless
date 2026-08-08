import {
  createMicrosoftAdsHealthFinding,
  createMicrosoftAdsHealthResult
} from './finding-schema.mjs'

const UET_DOC =
  'https://learn.microsoft.com/advertising/guides/universal-event-tracking?view=bingads-13'
const UET_STATUS_DOC =
  'https://learn.microsoft.com/advertising/campaign-management-service/uettagtrackingstatus?view=bingads-13'
const CONVERSION_STATUS_DOC =
  'https://learn.microsoft.com/advertising/campaign-management-service/conversiongoaltrackingstatus?view=bingads-13'
const CAPI_DOC =
  'https://learn.microsoft.com/advertising/guides/uet-conversion-api-integration?view=bingads-13'
const PRODUCT_AUDIENCE_DOC =
  'https://learn.microsoft.com/advertising/campaign-management-service/productaudience?view=bingads-13'

export function analyzeMicrosoftAdsTrackingHealth(audit) {
  const findings = []
  const accountProperties = audit?.accountProperties ?? {}
  const uetTags = audit?.uetTags ?? {}
  const conversionGoals = audit?.conversionGoals ?? {}
  const reportTotals = audit?.report?.totals ?? {}
  const local = audit?.localImplementation ?? {}
  const credentialReadiness = audit?.credentialReadiness ?? {}
  const dispatchEvidence = local?.providerDispatchEvidence ?? {}
  const providerDispatchEvidenceAvailable = dispatchEvidence?.ok === true
  const providerDispatchConfirmed = dispatchEvidence?.providerConfirmed === true
  const missingMsclkidSkipCount = numberValue(
    dispatchEvidence?.bySkipReason?.missing_msclkid
  )
  const adapterUnavailableAfterResetCount = numberValue(
    dispatchEvidence?.bySkipReason?.provider_adapter_unavailable_after_reset
  )

  const msclkidAutoTagging = accountProperties?.byName?.MSCLKIDAutoTaggingEnabled
  const cApiRequiresMsclkid = Boolean(local?.productPurchaseGoal?.cApiRequiresMsclkid)
  const cApiEndpointPresent = Boolean(local?.productPurchaseGoal?.cApiEndpointPresent)
  const cApiRequiresToken = Boolean(local?.productPurchaseGoal?.cApiRequiresToken)
  const cApiTokenPresent = Boolean(
    credentialReadiness?.uetCapiTokenPresent ?? audit?.config?.uetCapiToken
  )

  if (isFalseLike(msclkidAutoTagging)) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: cApiRequiresMsclkid ? 'critical' : 'high',
        code: cApiRequiresMsclkid
          ? 'MSCLKID_AUTO_TAGGING_DISABLED_WITH_LOCAL_CAPI_HARD_GATE'
          : 'MSCLKID_AUTO_TAGGING_DISABLED',
        area: 'attribution',
        title: 'MSCLKID auto-tagging is disabled',
        summary: cApiRequiresMsclkid
          ? 'Microsoft Ads auto-tagging is disabled while the local UET CAPI purchase implementation hard-skips events without MSCLKID.'
          : 'Microsoft Ads auto-tagging is disabled, reducing click-level attribution coverage for UET CAPI.',
        diagnosis: {
          certainty: cApiRequiresMsclkid ? 'probable' : 'confirmed',
          confidence: cApiRequiresMsclkid ? 0.95 : 1,
          rootCause: cApiRequiresMsclkid
            ? 'The local CAPI implementation requires MSCLKID, but Microsoft Ads is not configured to automatically append it to paid landing URLs.'
            : 'MSCLKIDAutoTaggingEnabled is false.',
          rationale:
            'Microsoft recommends sending MSCLKID whenever possible for CAPI attribution. MSCLKID is not a universal hard requirement of CAPI itself, so the local hard gate is stricter than the provider requirement.'
        },
        evidence: [
          {
            source: 'audit.accountProperties',
            key: 'MSCLKIDAutoTaggingEnabled',
            value: msclkidAutoTagging
          },
          {
            source: 'audit.localImplementation.productPurchaseGoal',
            key: 'cApiRequiresMsclkid',
            value: cApiRequiresMsclkid
          }
        ],
        remediation: {
          summary: cApiRequiresMsclkid
            ? 'Enable Microsoft Ads auto-tagging and separately evaluate whether the local CAPI hard requirement for MSCLKID should be relaxed in favor of Microsoft-supported alternative matching signals.'
            : 'Enable MSCLKID auto-tagging for stronger Microsoft Ads attribution.',
          backend: 'account-settings',
          operation: 'updateAccount',
          steps: [
            'Enable MSCLKID auto-tagging in the Microsoft Advertising account.',
            'Verify paid landing URLs receive msclkid after a real Microsoft ad click.',
            ...(cApiRequiresMsclkid
              ? [
                  'Review the local missing_msclkid skip policy: Microsoft recommends MSCLKID when available but CAPI also supports other matching/context signals.',
                  'Do not remove the local gate until the existing attribution and deduplication contract is reviewed end-to-end.'
                ]
              : [])
          ]
        },
        verification: [
          'MSCLKIDAutoTaggingEnabled is true.',
          'A real Microsoft Ads click reaches the landing page with msclkid.',
          ...(cApiRequiresMsclkid
            ? ['New eligible purchase events are no longer skipped solely because auto-tagging was disabled.']
            : [])
        ],
        sourceDocs: [CAPI_DOC]
      })
    )
  } else if (cApiRequiresMsclkid) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'medium',
        code: 'LOCAL_CAPI_MSCLKID_HARD_GATE',
        area: 'local_tracking',
        title: 'Local CAPI is stricter than Microsoft requires for MSCLKID',
        summary:
          'The inspected local purchase implementation appears to skip UET CAPI when MSCLKID is missing, even though Microsoft documents MSCLKID as strongly recommended whenever possible rather than the sole valid matching path.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 0.95,
          rootCause: 'Local purchase dispatch contains a missing_msclkid hard gate.'
        },
        evidence: [
          {
            source: 'audit.localImplementation.productPurchaseGoal',
            key: 'cApiRequiresMsclkid',
            value: true
          }
        ],
        remediation: {
          summary: 'Review whether purchases without MSCLKID can be sent safely using the provider-supported alternative identity/context fields already available in the Utekos tracking pipeline.',
          backend: 'local-code',
          operation: null,
          steps: [
            'Measure how many otherwise eligible purchase events are skipped by missing_msclkid.',
            'Compare the current event payload against Microsoft CAPI matching and deduplication requirements.',
            'If sufficient alternative signals exist, replace the hard skip with a quality classification rather than dropping the event.',
            'Verify deduplication remains stable between browser UET and CAPI.'
          ]
        },
        verification: [
          'Provider dispatch evidence shows the intended policy for purchases with and without MSCLKID.',
          'No duplicate conversions are introduced.',
          'Microsoft receives eligible purchase events with supported matching signals.'
        ],
        sourceDocs: [CAPI_DOC]
      })
    )
  }

  const tags = Array.isArray(uetTags?.tags) ? uetTags.tags : []

  if (uetTags?.error || uetTags?.ok === false) {
    findings.push(
      readFailureFinding(
        'UET_TAG_READ_FAILED',
        'UET tag health could not be read',
        uetTags?.error ?? 'UET tag read failed.',
        'uet'
      )
    )
  } else if (tags.length === 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'critical',
        code: 'UET_TAG_NOT_FOUND',
        area: 'uet',
        title: 'Configured UET tag was not found',
        summary: 'No UET tag was returned for the configured tag ID.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: 'The configured UET tag ID is unavailable in the authenticated Microsoft Ads account/customer context.'
        },
        evidence: [
          {
            source: 'audit.uetTags',
            key: 'count',
            value: 0
          }
        ],
        remediation: {
          summary: 'Resolve the configured UET tag/account relationship before debugging downstream conversion goals.',
          backend: 'campaign-management',
          operation: 'getUetTagsByIds',
          steps: [
            'Confirm the UET tag ID configured in the application.',
            'Confirm the authenticated CustomerId/AccountId has access to that UET tag.',
            'Correct the configuration or sharing relationship.',
            'Re-run tracking health.'
          ]
        },
        verification: ['The configured UET tag is returned by Campaign Management.'],
        sourceDocs: [UET_DOC]
      })
    )
  }

  for (const tag of tags) {
    const status = String(tag?.trackingStatus ?? '')

    if (status === 'Inactive' || status === 'Unverified') {
      findings.push(
        createMicrosoftAdsHealthFinding({
          severity: 'critical',
          code: `UET_TAG_${status.toUpperCase()}`,
          area: 'uet',
          title: `UET tag is ${status}`,
          summary:
            status === 'Inactive'
              ? 'Microsoft Advertising has not received user activity from this UET tag in the last 24 hours.'
              : 'Microsoft Advertising has not verified receiving activity from this UET tag.',
          entity: {
            type: 'uet_tag',
            id: tag?.id ?? null,
            name: tag?.name ?? null
          },
          diagnosis: {
            certainty: 'confirmed',
            confidence: 1,
            rootCause: `Microsoft UET tracking status is ${status}.`
          },
          evidence: [
            {
              source: 'audit.uetTags',
              key: 'trackingStatus',
              value: status
            }
          ],
          remediation: {
            summary: 'Verify the UET browser implementation and consent path reaches Microsoft.',
            backend: 'local-code',
            operation: null,
            steps: [
              'Verify the UET base tag loads for the intended consent state.',
              'Verify browser events reach the Microsoft UET endpoint.',
              'Confirm the tag ID in browser traffic matches the configured Microsoft UET tag.',
              'Re-check Microsoft tracking status after provider processing.'
            ]
          },
          verification: [
            'Browser/network evidence shows UET activity reaching Microsoft.',
            'Microsoft reports UET TrackingStatus=Active.'
          ],
          sourceDocs: [UET_STATUS_DOC, UET_DOC]
        })
      )
    }
  }

  const goals = Array.isArray(conversionGoals?.goals)
    ? conversionGoals.goals
    : []

  if (conversionGoals?.error || conversionGoals?.ok === false) {
    findings.push(
      readFailureFinding(
        'CONVERSION_GOAL_READ_FAILED',
        'Conversion goals could not be fully read',
        conversionGoals?.error ?? 'Conversion goal read failed.',
        'conversion_tracking'
      )
    )
  } else if (goals.length === 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'high',
        code: 'NO_CONVERSION_GOALS_VISIBLE',
        area: 'conversion_tracking',
        title: 'No conversion goals are visible for the configured UET tag',
        summary: 'The Campaign Management reads returned no conversion goals for the configured UET tag.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 0.9,
          rootCause: null,
          rationale:
            'This may mean no supported API-visible goals are configured for the tag, or that relevant product-goal behavior is represented through another Microsoft surface.'
        },
        evidence: [
          {
            source: 'audit.conversionGoals',
            key: 'count',
            value: 0
          }
        ],
        remediation: {
          summary: 'Verify conversion-goal configuration in Microsoft Advertising and align it with the events Utekos actually sends.',
          backend: 'campaign-management',
          operation: null,
          steps: [
            'Inspect conversion goals in Microsoft Advertising UI and API-visible goal types.',
            'Confirm the intended purchase and funnel goals are associated with the correct UET tag.',
            'Confirm event action/category/label conditions match emitted events.'
          ]
        },
        verification: ['Expected conversion goals are visible and their conditions match live event payloads.'],
        sourceDocs: [UET_DOC]
      })
    )
  }

  for (const goal of goals) {
    addConversionGoalStatusFinding(findings, goal, reportTotals)
  }

  const clicks = numberValue(reportTotals.clicks)
  const conversions = numberValue(reportTotals.allConversionsQualified)
  const activeUet = tags.some(tag => tag?.trackingStatus === 'Active')
  const noRecentGoals = goals.filter(goal => goal?.trackingStatus === 'NoRecentConversions')

  if (missingMsclkidSkipCount > 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: clicks > 0 && conversions === 0 ? 'high' : 'medium',
        code: 'MICROSOFT_UET_DISPATCH_SKIPPED_MISSING_MSCLKID',
        area: 'conversion_tracking',
        title: 'Microsoft UET dispatches are being skipped for missing MSCLKID',
        summary: `${missingMsclkidSkipCount} Microsoft UET provider attempts in the last ${dispatchEvidence.lookbackDays ?? 30} days were terminally skipped with missing_msclkid.`,
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause:
            'Production provider-dispatch evidence shows otherwise eligible Microsoft UET attempts are classified skipped_unqualified when MSCLKID is absent.',
          rationale:
            'This is runtime evidence from ops.provider_dispatch_attempts and takes precedence over static source-path heuristics.'
        },
        evidence: [
          {
            source: 'audit.localImplementation.providerDispatchEvidence',
            key: 'missing_msclkid',
            value: missingMsclkidSkipCount
          },
          {
            source: 'audit.localImplementation.providerDispatchEvidence',
            key: 'lastSeenAt',
            value:
              dispatchEvidence?.bySkipReasonLastSeenAt?.missing_msclkid ?? null
          },
          {
            source: 'audit.localImplementation.providerDispatchEvidence',
            key: 'missing_msclkid_by_event_name',
            value:
              dispatchEvidence?.bySkipReasonAndEventName?.missing_msclkid ?? {}
          },
          {
            source: 'audit.localImplementation.providerDispatchEvidence',
            key: 'acceptedCount',
            value: numberValue(dispatchEvidence?.acceptedCount)
          }
        ],
        remediation: {
          summary:
            'Restore MSCLKID capture/propagation for Microsoft paid traffic and verify the qualification policy against the supported CAPI matching contract before relaxing any gate.',
          backend: 'local-code',
          operation: null,
          steps: [
            'Verify MSCLKID auto-tagging is enabled in Microsoft Advertising.',
            'Trace a real Microsoft ad click through landing attribution, canonical event creation and provider payload construction.',
            'Confirm msclkid survives navigation and checkout attribution into the Microsoft UET provider attempt.',
            'Measure missing_msclkid again after the fix.',
            'Only relax the terminal skip if the current Microsoft CAPI contract and Utekos deduplication rules support the alternative matching path safely.'
          ]
        },
        verification: [
          'New Microsoft paid clicks create provider attempts with MSCLKID where expected.',
          'The missing_msclkid skip count stops increasing for qualified Microsoft traffic.',
          'Known conversions reach Microsoft UET/CAPI without introducing duplicate conversion credit.'
        ],
        sourceDocs: [CAPI_DOC]
      })
    )
  }

  if (
    adapterUnavailableAfterResetCount > 0 &&
    isRecentIsoTimestamp(
      dispatchEvidence?.bySkipReasonLastSeenAt?.provider_adapter_unavailable_after_reset,
      7
    )
  ) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'high',
        code: 'MICROSOFT_PROVIDER_ADAPTER_UNAVAILABLE_RECENTLY',
        area: 'local_tracking',
        title: 'Microsoft provider adapter was unavailable recently',
        summary: `${adapterUnavailableAfterResetCount} Microsoft UET dispatches were skipped because the provider adapter was unavailable after reset within the current evidence window.`,
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: 'provider_adapter_unavailable_after_reset'
        },
        evidence: [
          {
            source: 'audit.localImplementation.providerDispatchEvidence',
            key: 'provider_adapter_unavailable_after_reset',
            value: adapterUnavailableAfterResetCount
          }
        ],
        remediation: {
          summary: 'Verify the provider adapter registry and reset/bootstrap path remains stable in the current deployment.',
          backend: 'local-code',
          operation: null,
          steps: [
            'Inspect the current Microsoft UET adapter registration and reset path.',
            'Confirm new provider attempts resolve the microsoft_uet adapter.',
            'Re-run tracking health after current traffic has exercised the adapter.'
          ]
        },
        verification: [
          'No new provider_adapter_unavailable_after_reset skips are recorded for Microsoft UET.'
        ],
        sourceDocs: [CAPI_DOC]
      })
    )
  }

  if (clicks > 0 && conversions === 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: activeUet && noRecentGoals.length > 0 ? 'high' : 'medium',
        code: 'PAID_CLICKS_WITH_ZERO_QUALIFIED_CONVERSIONS',
        area: 'conversion_tracking',
        title: 'Paid clicks are present but qualified conversions are zero',
        summary: `Microsoft Reporting shows ${clicks} clicks and zero qualified conversions in the current report window.`,
        diagnosis: {
          certainty: activeUet && noRecentGoals.length > 0 ? 'probable' : 'possible',
          confidence: activeUet && noRecentGoals.length > 0 ? 0.85 : 0.6,
          rootCause:
            activeUet && noRecentGoals.length > 0
              ? 'The UET tag is active, but one or more conversion goals report NoRecentConversions. The remaining fault domain is goal matching, event delivery, attribution/matching, consent, or genuinely absent conversions.'
              : null
        },
        evidence: [
          {
            source: 'audit.report.totals',
            key: 'clicks',
            value: clicks
          },
          {
            source: 'audit.report.totals',
            key: 'allConversionsQualified',
            value: conversions
          },
          {
            source: 'audit.uetTags',
            key: 'activeUet',
            value: activeUet
          },
          {
            source: 'audit.conversionGoals',
            key: 'noRecentGoals',
            value: noRecentGoals.map(goal => ({
              id: goal.id,
              name: goal.name,
              trackingStatus: goal.trackingStatus
            }))
          }
        ],
        remediation: {
          summary: 'Trace one real conversion end-to-end instead of changing campaign optimization settings blindly.',
          backend: 'local-code',
          operation: null,
          steps: [
            'Generate or identify a real consented purchase or target conversion.',
            'Verify browser UET emission and the exact event payload.',
            'Verify server-side UET CAPI dispatch status and provider response.',
            'Compare the emitted event against Microsoft conversion-goal conditions.',
            'Verify the event appears in Microsoft after provider processing.'
          ]
        },
        verification: [
          'A known conversion is accepted by the Microsoft delivery path.',
          'The intended Microsoft goal begins recording conversions.',
          'Reporting shows the conversion after normal processing delay.'
        ],
        sourceDocs: [CAPI_DOC, CONVERSION_STATUS_DOC]
      })
    )
  }

  addLocalImplementationFindings(findings, local, cApiEndpointPresent, cApiRequiresToken, cApiTokenPresent)

  const coverageChecks = [
    {
      name: 'accountProperties',
      ok: accountProperties?.ok !== false && !accountProperties?.error,
      reason: accountProperties?.error ?? null
    },
    {
      name: 'uetTags',
      ok: uetTags?.ok !== false && !uetTags?.error,
      reason: uetTags?.error ?? null
    },
    {
      name: 'conversionGoals',
      ok: conversionGoals?.ok !== false && !conversionGoals?.error,
      reason: conversionGoals?.error ?? null
    },
    {
      name: 'reporting',
      ok: audit?.report?.ok !== false && !audit?.report?.error,
      reason: audit?.report?.error ?? null
    },
    {
      name: 'providerDispatchEvidence',
      ok: providerDispatchEvidenceAvailable,
      reason: providerDispatchEvidenceAvailable
        ? null
        : dispatchEvidence?.reason ?? 'Microsoft UET provider-dispatch evidence is unavailable.'
    },
    {
      name: 'localImplementation',
      ok: Boolean(local && Object.keys(local).length > 0),
      reason: local && Object.keys(local).length > 0 ? null : 'Local implementation scan is missing.'
    }
  ]

  return createMicrosoftAdsHealthResult({
    scope: 'tracking',
    findings,
    coverage: {
      complete: coverageChecks.every(check => check.ok),
      checks: coverageChecks
    },
    metrics: {
      uetTagCount: tags.length,
      activeUetTagCount: tags.filter(tag => tag?.trackingStatus === 'Active').length,
      conversionGoalCount: goals.length,
      noRecentConversionGoalCount: noRecentGoals.length,
      clicks,
      allConversionsQualified: conversions,
      msclkidAutoTaggingEnabled: !isFalseLike(msclkidAutoTagging),
      uetCapiEndpointPresent: cApiEndpointPresent,
      uetCapiTokenPresent: cApiTokenPresent,
      localCapiRequiresMsclkid: cApiRequiresMsclkid,
      providerDispatchEvidenceAvailable,
      providerDispatchConfirmed,
      providerDispatchAttemptCount: numberValue(dispatchEvidence?.rowCount),
      providerDispatchAcceptedCount: numberValue(dispatchEvidence?.acceptedCount),
      providerDispatchSkippedCount: numberValue(dispatchEvidence?.skippedCount),
      providerDispatchFailedCount: numberValue(dispatchEvidence?.failedCount),
      missingMsclkidSkipCount
    }
  })
}

function addConversionGoalStatusFinding(findings, goal, reportTotals) {
  const status = String(goal?.trackingStatus ?? '')

  if (['TagUnverified', 'TagInactive', 'InactiveDueToTagUnavailable'].includes(status)) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'critical',
        code: `CONVERSION_GOAL_${sanitizeCode(status)}`,
        area: 'conversion_tracking',
        title: `Conversion goal tracking is ${status}`,
        summary: `Conversion goal '${goal?.name ?? goal?.id}' has Microsoft tracking status ${status}.`,
        entity: {
          type: 'conversion_goal',
          id: goal?.id ?? null,
          name: goal?.name ?? null
        },
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: `Microsoft returned ConversionGoalTrackingStatus=${status}.`
        },
        evidence: [
          {
            source: 'audit.conversionGoals',
            key: 'trackingStatus',
            value: status
          },
          {
            source: 'audit.conversionGoals',
            key: 'tagId',
            value: goal?.tagId ?? null
          }
        ],
        remediation: {
          summary: 'Resolve the UET tag availability/activity problem before changing the conversion goal conditions.',
          backend: 'campaign-management',
          operation: null,
          steps: [
            'Verify the associated UET tag is available to the account.',
            'Verify the tag is active and receives browser activity.',
            'Re-check the goal tracking status after UET health is restored.'
          ]
        },
        verification: ['The goal tracking status becomes RecordingConversions or NoRecentConversions with an active UET tag.'],
        sourceDocs: [CONVERSION_STATUS_DOC]
      })
    )
    return
  }

  if (status === 'NoRecentConversions' && numberValue(reportTotals?.clicks) > 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'medium',
        code: 'CONVERSION_GOAL_NO_RECENT_CONVERSIONS',
        area: 'conversion_tracking',
        title: 'Conversion goal has no recent conversions',
        summary: `Goal '${goal?.name ?? goal?.id}' is attached to an active UET context but has not recorded conversions in the last 7 days.`,
        entity: {
          type: 'conversion_goal',
          id: goal?.id ?? null,
          name: goal?.name ?? null
        },
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: null,
          rationale:
            'Microsoft defines NoRecentConversions as an active UET tag with no conversions recorded for the goal in the last 7 days. The reason can be incorrect goal conditions, missing conversion events, or genuinely no qualifying conversions.'
        },
        evidence: [
          {
            source: 'audit.conversionGoals',
            key: 'trackingStatus',
            value: status
          },
          {
            source: 'audit.report.totals',
            key: 'clicks',
            value: reportTotals.clicks
          }
        ],
        remediation: {
          summary: 'Compare the goal conditions with a real emitted conversion event.',
          backend: 'campaign-management',
          operation: null,
          steps: [
            'Inspect the goal type and event/category/action/label conditions.',
            'Capture a real target event from the browser/server path.',
            'Compare the actual event payload to the goal conditions.',
            'Correct the mismatching side and verify recording.'
          ]
        },
        verification: ['The goal records a known target conversion and eventually reports RecordingConversions.'],
        sourceDocs: [CONVERSION_STATUS_DOC, UET_DOC]
      })
    )
  }
}

function addLocalImplementationFindings(
  findings,
  local,
  cApiEndpointPresent,
  cApiRequiresToken,
  cApiTokenPresent
) {
  const missingFiles = (local?.inspectedFiles ?? []).filter(file => !file?.exists)

  if (missingFiles.length > 0) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'high',
        code: 'LOCAL_MICROSOFT_TRACKING_FILES_MISSING',
        area: 'local_tracking',
        title: 'Expected Microsoft tracking implementation files are missing',
        summary: `${missingFiles.length} files expected by the Microsoft tracking audit were not found.`,
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: 'The local implementation scan could not find all expected Microsoft tracking files.'
        },
        evidence: [
          {
            source: 'audit.localImplementation.inspectedFiles',
            key: 'missing',
            value: missingFiles
          }
        ],
        remediation: {
          summary: 'Determine whether the files were intentionally replaced or the tracking implementation is incomplete.',
          backend: 'local-code',
          operation: null,
          steps: [
            'Inspect the current repository tracking architecture.',
            'Update the audit paths if responsibility moved intentionally.',
            'Restore missing implementation only if the functionality is actually absent.'
          ]
        },
        verification: ['The local audit points to the current authoritative tracking implementation and all required surfaces are present.'],
        sourceDocs: []
      })
    )
  }

  if (local?.browserEvents && local.browserEvents.dispatcherPresent === false) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'high',
        code: 'MICROSOFT_BROWSER_UET_DISPATCHER_NOT_CONFIRMED',
        area: 'local_tracking',
        title: 'Microsoft browser event dispatcher is not confirmed',
        summary: 'The inspected browser UET implementation does not confirm the expected dispatcher.',
        diagnosis: {
          certainty: 'possible',
          confidence: 0.75,
          rootCause: null,
          rationale: 'Responsibility may have moved to another implementation surface, so absence in the inspected file is not by itself proof that browser UET is missing.'
        },
        evidence: [
          {
            source: 'audit.localImplementation.browserEvents',
            key: 'dispatcherPresent',
            value: false
          }
        ],
        remediation: {
          summary: 'Locate the current owner of Microsoft browser UET event emission and verify it at runtime.',
          backend: 'local-code',
          operation: null,
          steps: [
            'Find the active browser UET owner in app/GTM code.',
            'Verify consent gating and queue/network emission in a browser.',
            'Update the local audit to inspect the authoritative owner.'
          ]
        },
        verification: ['A browser smoke proves the intended UET event reaches Microsoft under the correct consent state.'],
        sourceDocs: [UET_DOC]
      })
    )
  }

  if (cApiEndpointPresent && cApiRequiresToken && !cApiTokenPresent) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'critical',
        code: 'MICROSOFT_UET_CAPI_TOKEN_MISSING',
        area: 'local_tracking',
        title: 'Microsoft UET CAPI token is missing',
        summary: 'The local server-side purchase implementation requires UET CAPI authorization, but the audit does not see a configured token.',
        diagnosis: {
          certainty: 'confirmed',
          confidence: 1,
          rootCause: 'The CAPI endpoint is implemented and token-gated, while uetCapiTokenPresent is false.'
        },
        evidence: [
          {
            source: 'audit.credentialReadiness',
            key: 'uetCapiTokenPresent',
            value: false
          },
          {
            source: 'audit.localImplementation.productPurchaseGoal',
            key: 'cApiRequiresToken',
            value: true
          }
        ],
        remediation: {
          summary: 'Configure the UET tag CAPI authorization token used by the server-side purchase endpoint.',
          backend: 'account-settings',
          operation: null,
          steps: [
            'Confirm the correct UET tag and its CAPI authorization token.',
            'Store the token in the supported secret environment variable.',
            'Run a server-side purchase smoke and inspect the Microsoft response.'
          ]
        },
        verification: ['A CAPI purchase request is authenticated and receives an accepted Microsoft response.'],
        sourceDocs: [CAPI_DOC]
      })
    )
  }

  const providerQueue = local?.providerQueue ?? {}

  const runtimeProviderConfirmed =
    local?.providerDispatchEvidence?.providerConfirmed === true

  if (
    !runtimeProviderConfirmed &&
    providerQueue?.serverQueueIncludesMicrosoft === false
  ) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'high',
        code: 'MICROSOFT_PROVIDER_QUEUE_NOT_CONFIRMED',
        area: 'local_tracking',
        title: 'Microsoft provider routing is not confirmed',
        summary: 'Neither current runtime dispatch evidence nor the current source scan confirms Microsoft as a server provider.',
        diagnosis: {
          certainty: 'probable',
          confidence: 0.9,
          rootCause: providerQueue?.providerTypeDeclaration ?? null,
          rationale:
            'Runtime provider-dispatch evidence takes precedence over static source inspection. This finding is emitted only when neither source confirms Microsoft routing.'
        },
        evidence: [
          {
            source: 'audit.localImplementation.providerQueue',
            key: 'providerQueue',
            value: providerQueue
          }
        ],
        remediation: {
          summary: 'Confirm the current server-side Microsoft dispatch owner and restore Microsoft provider routing if it is actually absent.',
          backend: 'local-code',
          operation: null,
          steps: [
            'Inspect the current accepted-event provider routing.',
            'Confirm whether Microsoft UET CAPI is intentionally server_direct, server_retry, or owned elsewhere.',
            'Correct the routing contract only if live provider dispatch evidence confirms a gap.'
          ]
        },
        verification: ['A real eligible Microsoft event produces the intended provider dispatch/audit evidence.'],
        sourceDocs: [CAPI_DOC]
      })
    )
  }

  if (local?.productPurchaseGoal?.productIdPayloadPresent === false) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'medium',
        code: 'MICROSOFT_ECOMMERCE_PRODUCT_IDS_NOT_CONFIRMED',
        area: 'signal_quality',
        title: 'Microsoft ecommerce product IDs are not confirmed',
        summary:
          'The inspected browser product-purchase implementation does not confirm ecomm_prodid/product IDs that can be matched to Merchant Center products.',
        diagnosis: {
          certainty: 'possible',
          confidence: 0.75,
          rootCause: null
        },
        evidence: [
          {
            source: 'audit.localImplementation.productPurchaseGoal',
            key: 'productIdPayloadPresent',
            value: false
          }
        ],
        remediation: {
          summary: 'Verify ecommerce product IDs are emitted and match Merchant Center id or item_group_id values.',
          backend: 'local-code',
          operation: null,
          steps: [
            'Capture the live Microsoft ecommerce event payload.',
            'Compare product IDs against Merchant Center product identifiers.',
            'Correct the event/feed mapping if they differ.'
          ]
        },
        verification: ['Live Microsoft ecommerce events contain product IDs matching Merchant Center products.'],
        sourceDocs: [PRODUCT_AUDIENCE_DOC, CAPI_DOC]
      })
    )
  }

  const browserEventName = local?.productPurchaseGoal?.localHelperEventAction
  const serverEventName = local?.productPurchaseGoal?.serverCapiEventAction

  if (
    browserEventName &&
    serverEventName &&
    browserEventName !== 'unknown' &&
    serverEventName !== 'unknown' &&
    browserEventName !== serverEventName
  ) {
    findings.push(
      createMicrosoftAdsHealthFinding({
        severity: 'high',
        code: 'MICROSOFT_BROWSER_CAPI_EVENT_NAME_MISMATCH',
        area: 'deduplication',
        title: 'Browser and CAPI purchase event names differ',
        summary: `Browser purchase event '${browserEventName}' and server CAPI event '${serverEventName}' do not match.`,
        diagnosis: {
          certainty: 'confirmed',
          confidence: 0.95,
          rootCause: 'Browser and server implementations use different purchase event names.'
        },
        evidence: [
          {
            source: 'audit.localImplementation.productPurchaseGoal',
            key: 'eventNames',
            value: { browserEventName, serverEventName }
          }
        ],
        remediation: {
          summary: 'Align browser and CAPI event semantics and retain the same stable eventId for duplicate events.',
          backend: 'local-code',
          operation: null,
          steps: [
            'Confirm the canonical Microsoft purchase event name.',
            'Align browser and CAPI eventName values.',
            'Verify both paths share the intended deduplication eventId.'
          ]
        },
        verification: ['Browser and CAPI purchase events have compatible event names and the same deduplication ID for the same conversion.'],
        sourceDocs: [CAPI_DOC]
      })
    )
  }
}

function readFailureFinding(code, title, error, area) {
  return createMicrosoftAdsHealthFinding({
    severity: 'high',
    code,
    area,
    title,
    summary: error,
    diagnosis: {
      certainty: 'confirmed',
      confidence: 1,
      rootCause: error
    },
    evidence: [
      {
        source: 'audit',
        key: 'error',
        value: error
      }
    ],
    remediation: {
      summary: 'Resolve the failed Microsoft read before drawing further conclusions from this surface.',
      backend: 'campaign-management',
      operation: null,
      steps: [
        'Inspect the provider error.',
        'Correct the request/auth/configuration problem.',
        'Re-run tracking health.'
      ]
    },
    verification: ['The provider read succeeds on the next health scan.'],
    sourceDocs: []
  })
}

function isFalseLike(value) {
  return value === false || String(value ?? '').trim().toLowerCase() === 'false'
}

function numberValue(value) {
  return Number(String(value ?? '').replaceAll(',', '')) || 0
}

function isRecentIsoTimestamp(value, days) {
  if (!value || !Number.isFinite(days) || days <= 0) return false
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return false
  return Date.now() - timestamp <= days * 86_400_000
}

function sanitizeCode(value) {
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
