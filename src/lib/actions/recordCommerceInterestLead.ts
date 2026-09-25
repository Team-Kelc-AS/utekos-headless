'use server'

import 'server-only'

import crypto from 'node:crypto'

import type { GenerateLeadDataLayerEvent } from '@/lib/analytics/generateLeadEvent'
import {
  defaultTrackingAuthorization,
  leadFormTrackingContextSchema,
  type LeadFormTrackingContext
} from '@/lib/analytics/leadFormTrackingContext'
import { getLeadRequestContextFromHeaders } from '@/lib/analytics/server/getLeadRequestContextFromHeaders'
import { recordAcceptedGenerateLead } from '@/lib/analytics/server/recordAcceptedGenerateLead'
import {
  COMMERCE_INTEREST_LEAD_FORM_IDS,
  LEAD_TYPES,
  type CommerceInterestLeadFormId
} from '@/lib/leads/leadFormIds'
import { classifyOperationalFailure } from '@/lib/observability/logging/appLogContract'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'

const allowedFormIds = new Set<string>(
  Object.values(COMMERCE_INTEREST_LEAD_FORM_IDS)
)

export type RecordCommerceInterestLeadResult =
  | {
      status: 'success'
      eventId: string
      dataLayerEvent: GenerateLeadDataLayerEvent
    }
  | { status: 'skipped' }
  | { status: 'error' }

export async function recordCommerceInterestLead(input: {
  formId: CommerceInterestLeadFormId
  trackingContext: LeadFormTrackingContext
}): Promise<RecordCommerceInterestLeadResult> {
  if (!allowedFormIds.has(input.formId)) {
    return { status: 'skipped' }
  }

  const parsed = leadFormTrackingContextSchema.safeParse(
    input.trackingContext
  )
  if (!parsed.success) {
    return { status: 'skipped' }
  }

  const context = parsed.data
  const consent =
    context.consent ?? defaultTrackingAuthorization()

  if (
    consent.analytics !== 'granted' &&
    consent.marketing !== 'granted'
  ) {
    return { status: 'skipped' }
  }

  const submissionId = crypto.randomUUID()

  try {
    const requestContext = await getLeadRequestContextFromHeaders()
    // Builds fbc/fbp/external_id from cookies + client_ip/user_agent from
    // request headers; CAPI and dataLayer share submissionId as event_id.
    const result = await recordAcceptedGenerateLead({
      consent,
      submissionId,
      formId: input.formId,
      leadType: LEAD_TYPES.commerceInterest,
      pageUrl: context.page_url,
      ...(context.page_view_id ?
        { pageViewId: context.page_view_id }
      : {}),
      ...(context.referrer_url ?
        { referrerUrl: context.referrer_url }
      : {}),
      ...((
        consent.analytics === 'granted' && context.journey_id
      ) ?
        { journeyId: context.journey_id }
      : {}),
      ...(context.cookie_header ?
        { cookieHeader: context.cookie_header }
      : {}),
      requestContext
    })

    if (result.status === 'skipped') {
      return { status: 'skipped' }
    }

    return {
      status: 'success',
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
    return { status: 'error' }
  }
}
