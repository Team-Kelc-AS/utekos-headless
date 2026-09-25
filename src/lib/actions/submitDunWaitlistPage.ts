'use server'

import 'server-only'

import crypto from 'node:crypto'

import {
  DunWaitlistPageSchema,
  type DunWaitlistPageData
} from '@/db/zod/schemas/DunWaitlistPageSchema'
import type { GenerateLeadDataLayerEvent } from '@/lib/analytics/generateLeadEvent'
import { parseLeadFormTrackingContext } from '@/lib/analytics/leadFormTrackingContext'
import {
  LEAD_FORM_IDS,
  LEAD_SOURCES,
  LEAD_TYPES
} from '@/lib/leads/leadFormIds'
import { recordLeadSubmission } from '@/lib/leads/recordLeadSubmission'
import { z } from 'zod'

export type DunWaitlistPageActionState = {
  status: 'idle' | 'success' | 'error'
  message: string
  errors?: Partial<Record<keyof DunWaitlistPageData, string[]>>
  eventId?: string
  dataLayerEvent?: GenerateLeadDataLayerEvent
}

export async function submitDunWaitlistPage(
  _previousState: DunWaitlistPageActionState,
  formData: FormData
): Promise<DunWaitlistPageActionState> {
  const result = DunWaitlistPageSchema.safeParse({
    email: formData.get('email'),
    phone: formData.get('phone'),
    website: formData.get('website') ?? '',
    estimatedSize: formData.get('estimatedSize') ?? undefined
  })

  if (!result.success) {
    return {
      status: 'error',
      message: 'Kontroller feltene og prøv igjen.',
      errors: z.flattenError(result.error).fieldErrors
    }
  }

  if (result.data.website) {
    return {
      status: 'success',
      message: 'Du står på ventelisten.'
    }
  }

  const trackingContext = parseLeadFormTrackingContext(
    formData.get('leadTrackingContext')
  )
  const leadId = crypto.randomUUID()

  const leadResult = await recordLeadSubmission({
    leadId,
    email: result.data.email.toLowerCase(),
    phone: result.data.phone,
    formId: LEAD_FORM_IDS.productWaitlistUtekosDun,
    leadType: LEAD_TYPES.productWaitlist,
    source: LEAD_SOURCES.productWaitlistUtekosDun,
    productHandle: 'utekos-dun',
    entryPoint: 'dun_waitlist_page',
    ...(result.data.estimatedSize ?
      { estimatedSize: result.data.estimatedSize }
    : {}),
    ...(trackingContext ? { trackingContext } : {})
  })

  if (leadResult.persisted === false) {
    return {
      status: 'error',
      message: 'Påmeldingen kunne ikke lagres. Prøv igjen.'
    }
  }

  return {
    status: 'success',
    message: 'Du står på ventelisten.',
    ...(leadResult.eventId ?
      { eventId: leadResult.eventId }
    : {}),
    ...(leadResult.dataLayerEvent ?
      { dataLayerEvent: leadResult.dataLayerEvent }
    : {})
  }
}
