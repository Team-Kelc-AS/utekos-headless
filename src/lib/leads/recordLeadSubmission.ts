import 'server-only'

import type { GenerateLeadDataLayerEvent } from '@/lib/analytics/generateLeadEvent'
import {
  deniedCookiebotConsent,
  type LeadFormTrackingContext
} from '@/lib/analytics/leadFormTrackingContext'
import { getLeadRequestContextFromHeaders } from '@/lib/analytics/server/getLeadRequestContextFromHeaders'
import { recordAcceptedGenerateLead } from '@/lib/analytics/server/recordAcceptedGenerateLead'
import { classifyOperationalFailure } from '@/lib/observability/logging/appLogContract'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'
import type {
  LeadFormId,
  LeadSource,
  LeadType
} from './leadFormIds'
import { insertMarketingLead } from './insertMarketingLead'

export type RecordLeadSubmissionInput = {
  email: string
  entryPoint?: string
  firstName?: string
  formId: LeadFormId
  leadId: string
  leadType: LeadType
  phone?: string
  productHandle?: string
  source: LeadSource
  trackingContext?: LeadFormTrackingContext
}

export type RecordLeadSubmissionResult = {
  dataLayerEvent?: GenerateLeadDataLayerEvent
  eventId?: string
  leadId: string
}

export async function recordLeadSubmission(
  input: RecordLeadSubmissionInput
): Promise<RecordLeadSubmissionResult> {
  const consent =
    input.trackingContext?.consent ?? deniedCookiebotConsent()
  const consentedAt =
    consent.marketing === 'granted' ?
      new Date().toISOString()
    : undefined

  try {
    await insertMarketingLead({
      id: input.leadId,
      email: input.email,
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.firstName ? { firstName: input.firstName } : {}),
      source: input.source,
      ...(input.trackingContext?.campaign ?
        { campaign: input.trackingContext.campaign }
      : {}),
      ...(input.trackingContext?.medium ?
        { medium: input.trackingContext.medium }
      : {}),
      ...(input.trackingContext?.content ?
        { content: input.trackingContext.content }
      : {}),
      ...(input.trackingContext?.term ?
        { term: input.trackingContext.term }
      : {}),
      consentMarketing: consent.marketing === 'granted',
      consentSource: 'cookiebot',
      ...(consentedAt ? { consentedAt } : {}),
      metadata: {
        form_id: input.formId,
        lead_type: input.leadType,
        ...(input.trackingContext?.page_url ?
          { page_url: input.trackingContext.page_url }
        : {}),
        ...(input.productHandle ?
          { product_handle: input.productHandle }
        : {}),
        ...(input.entryPoint ?
          { entry_point: input.entryPoint }
        : {})
      }
    })
  } catch (error: unknown) {
    await logToAppLogs({
      event: 'lead.persist_failed',
      level: 'ERROR',
      data: {
        reasonCode: classifyOperationalFailure(error),
        formId: input.formId
      },
      context: {}
    })
    return { leadId: input.leadId }
  }

  const pageUrl = input.trackingContext?.page_url
  // #region agent log
  fetch(
    'http://127.0.0.1:7626/ingest/3d726327-2da6-4157-aa0a-bb33dbbbefd1',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '2aed25'
      },
      body: JSON.stringify({
        sessionId: '2aed25',
        runId: 'pre-fix',
        hypothesisId: 'H7',
        location: 'recordLeadSubmission.ts:beforeCanonical',
        message: 'lead submission before generate_lead',
        data: {
          formId: input.formId,
          hasPageUrl: Boolean(pageUrl),
          analytics: consent.analytics,
          marketing: consent.marketing,
          hasCookieHeader: Boolean(
            input.trackingContext?.cookie_header
          )
        },
        timestamp: Date.now()
      })
    }
  ).catch(() => {})
  // #endregion
  if (!pageUrl) {
    await logToAppLogs({
      event: 'lead.record_skipped',
      level: 'ERROR',
      data: {
        reasonCode: 'missing_page_url',
        formId: input.formId
      },
      context: {}
    })
    return { leadId: input.leadId }
  }

  try {
    const requestContext =
      await getLeadRequestContextFromHeaders()
    const result = await recordAcceptedGenerateLead({
      consent,
      submissionId: input.leadId,
      formId: input.formId,
      leadType: input.leadType,
      email: input.email,
      pageUrl,
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.trackingContext?.page_view_id ?
        { pageViewId: input.trackingContext.page_view_id }
      : {}),
      ...((
        consent.analytics === 'granted' &&
        input.trackingContext?.journey_id
      ) ?
        { journeyId: input.trackingContext.journey_id }
      : {}),
      ...(input.trackingContext?.cookie_header ?
        { cookieHeader: input.trackingContext.cookie_header }
      : {}),
      requestContext
    })

    if (result.status === 'skipped') {
      // #region agent log
      fetch(
        'http://127.0.0.1:7626/ingest/3d726327-2da6-4157-aa0a-bb33dbbbefd1',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '2aed25'
          },
          body: JSON.stringify({
            sessionId: '2aed25',
            runId: 'pre-fix',
            hypothesisId: 'H7',
            location: 'recordLeadSubmission.ts:skipped',
            message: 'generate_lead skipped',
            data: {
              formId: input.formId,
              analytics: consent.analytics,
              marketing: consent.marketing
            },
            timestamp: Date.now()
          })
        }
      ).catch(() => {})
      // #endregion
      return { leadId: input.leadId }
    }

    return {
      leadId: input.leadId,
      eventId: result.eventId,
      dataLayerEvent: result.dataLayerEvent
    }
  } catch (error: unknown) {
    await logToAppLogs({
      event: 'lead.record_failed',
      level: 'ERROR',
      data: {
        reasonCode: classifyOperationalFailure(error),
        formId: input.formId
      },
      context: {}
    })
    return { leadId: input.leadId }
  }
}
